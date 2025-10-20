import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { withApiHandler } from "@/lib/api/apiHandler";
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
  QuotaExceededError,
} from "@/lib/errors/AppError";
import { enforceQuota } from "@/lib/billing";
import {
  generateInvoiceNumber,
  calculateInvoiceTotal,
  calculateDueDate,
  getInvoiceSettings,
} from "@/lib/invoices/helpers";
import { eurosToCents } from "@/types/invoice";
import type { Invoice, InvoiceFormData } from "@/types/invoice";

export const dynamic = 'force-dynamic';

// ============================================
// GET /api/invoices - Liste des factures
// ============================================
export const GET = withApiHandler(async (req: NextRequest) => {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthenticationError();
  }

  // Get workspace
  const { data: wm, error: wmError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (wmError) {
    throw new DatabaseError("Erreur lors de la récupération du workspace", { error: wmError });
  }
  
  if (!wm) {
    throw new ValidationError("Aucun workspace trouvé");
  }

  // Parse query params pour filtres
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const clientId = url.searchParams.get('client_id');
  const fromDate = url.searchParams.get('from_date');
  const toDate = url.searchParams.get('to_date');
  const search = url.searchParams.get('search');

  // Build query
  let query = supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      issue_date,
      due_date,
      status,
      total_cents,
      paid_at,
      client:clients (
        id,
        first_name,
        last_name,
        email
      ),
      created_at
    `)
    .eq("workspace_id", wm.workspace_id)
    .order("issue_date", { ascending: false });

  // Apply filters
  if (status) {
    query = query.eq('status', status);
  }
  if (clientId) {
    query = query.eq('client_id', clientId);
  }
  if (fromDate) {
    query = query.gte('issue_date', fromDate);
  }
  if (toDate) {
    query = query.lte('issue_date', toDate);
  }
  if (search) {
    query = query.or(`invoice_number.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  const { data, error } = await query;
    
  if (error) {
    throw new DatabaseError("Erreur lors de la récupération des factures", { error });
  }

  return data || [];
});

// ============================================
// POST /api/invoices - Créer une facture
// ============================================
export const POST = withApiHandler(async (req: NextRequest) => {
  // Check quota
  const quota = await enforceQuota("invoices", "issue_date");
  if (!quota.allowed) {
    throw new QuotaExceededError(quota.reason || "Quota de factures atteint", "/app/billing");
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body: InvoiceFormData = await req.json();

  // Validation
  if (!body.client_id) {
    throw new ValidationError("Le client est obligatoire");
  }
  if (!body.items || body.items.length === 0) {
    throw new ValidationError("Au moins un item est requis");
  }
  if (!body.issue_date) {
    throw new ValidationError("La date d'émission est obligatoire");
  }

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthenticationError();
  }

  // Get workspace
  const { data: wm, error: wmError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (wmError) {
    throw new DatabaseError("Erreur workspace", { error: wmError });
  }
  
  if (!wm) {
    throw new ValidationError("Aucun workspace trouvé");
  }

  // Get invoice settings
  const settings = await getInvoiceSettings(wm.workspace_id);

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(wm.workspace_id);

  // Calculate totals
  const { subtotalCents, taxAmountCents, totalCents } = calculateInvoiceTotal(
    body.items,
    body.tax_rate || settings.default_tax_rate,
    body.discount_cents || 0
  );

  // Calculate due date if not provided
  const dueDate = body.due_date || calculateDueDate(
    body.issue_date,
    settings.default_due_days
  );

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      workspace_id: wm.workspace_id,
      client_id: body.client_id,
      invoice_number: invoiceNumber,
      issue_date: body.issue_date,
      due_date: dueDate,
      status: 'draft',
      subtotal_cents: subtotalCents,
      tax_rate: body.tax_rate || settings.default_tax_rate,
      tax_amount_cents: taxAmountCents,
      discount_cents: body.discount_cents || 0,
      total_cents: totalCents,
      notes: body.notes,
      internal_notes: body.internal_notes,
      terms: body.terms || settings.default_payment_terms,
      created_by: user.id,
    })
    .select()
    .single();
    
  if (invoiceError) {
    throw new DatabaseError("Erreur lors de la création de la facture", { error: invoiceError });
  }

  // Create invoice items
  const itemsToInsert = body.items.map((item, index) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: eurosToCents(item.unit_price),
    total_cents: eurosToCents(item.quantity * item.unit_price),
    position: index,
  }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(itemsToInsert);
    
  if (itemsError) {
    // Rollback: delete invoice
    await supabase.from("invoices").delete().eq("id", invoice.id);
    throw new DatabaseError("Erreur lors de la création des items", { error: itemsError });
  }

  // Return created invoice with items
  const { data: fullInvoice, error: fetchError } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients (*),
      items:invoice_items (*)
    `)
    .eq("id", invoice.id)
    .single();
    
  if (fetchError) {
    throw new DatabaseError("Erreur lors de la récupération de la facture", { error: fetchError });
  }

  return fullInvoice;
});
