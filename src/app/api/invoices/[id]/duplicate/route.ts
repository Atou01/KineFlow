import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { withApiHandler } from "@/lib/api/apiHandler";
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
} from "@/lib/errors/AppError";
import { verifyInvoiceAccess, generateInvoiceNumber } from "@/lib/invoices/helpers";

export const dynamic = 'force-dynamic';

// ============================================
// POST /api/invoices/:id/duplicate - Dupliquer facture
// ============================================
export const POST = withApiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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
    throw new DatabaseError("Erreur workspace", { error: wmError });
  }
  
  if (!wm) {
    throw new ValidationError("Aucun workspace trouvé");
  }

  // Verify access
  await verifyInvoiceAccess(params.id, wm.workspace_id);

  // Get original invoice with items
  const { data: original, error: fetchError } = await supabase
    .from("invoices")
    .select(`
      *,
      items:invoice_items (*)
    `)
    .eq("id", params.id)
    .single();
    
  if (fetchError) {
    throw new DatabaseError("Erreur lors de la récupération", { error: fetchError });
  }

  // Generate new invoice number
  const newInvoiceNumber = await generateInvoiceNumber(wm.workspace_id);

  // Create duplicate invoice
  const { data: newInvoice, error: createError } = await supabase
    .from("invoices")
    .insert({
      workspace_id: original.workspace_id,
      client_id: original.client_id,
      invoice_number: newInvoiceNumber,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      subtotal_cents: original.subtotal_cents,
      tax_rate: original.tax_rate,
      tax_amount_cents: original.tax_amount_cents,
      discount_cents: original.discount_cents,
      total_cents: original.total_cents,
      notes: original.notes,
      terms: original.terms,
      created_by: user.id,
    })
    .select()
    .single();
    
  if (createError) {
    throw new DatabaseError("Erreur lors de la duplication", { error: createError });
  }

  // Duplicate items
  if (original.items && original.items.length > 0) {
    const newItems = original.items.map((item: any, index: number) => ({
      invoice_id: newInvoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      total_cents: item.total_cents,
      position: index,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(newItems);
      
    if (itemsError) {
      // Rollback: delete invoice
      await supabase.from("invoices").delete().eq("id", newInvoice.id);
      throw new DatabaseError("Erreur lors de la duplication des items", { error: itemsError });
    }
  }

  return { 
    success: true, 
    message: "Facture dupliquée",
    data: newInvoice,
  };
});
