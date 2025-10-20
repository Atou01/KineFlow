import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { withApiHandler } from "@/lib/api/apiHandler";
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
  NotFoundError,
} from "@/lib/errors/AppError";
import { verifyInvoiceAccess } from "@/lib/invoices/helpers";

export const dynamic = 'force-dynamic';

// ============================================
// GET /api/invoices/:id - Détails facture
// ============================================
export const GET = withApiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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

  // Get invoice with details
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients (*),
      items:invoice_items (*)
    `)
    .eq("id", params.id)
    .single();
    
  if (error) {
    throw new DatabaseError("Erreur lors de la récupération", { error });
  }

  return invoice;
});

// ============================================
// PATCH /api/invoices/:id - Modifier facture
// ============================================
export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();
  
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

  // Update invoice
  const { data: invoice, error } = await supabase
    .from("invoices")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();
    
  if (error) {
    throw new DatabaseError("Erreur lors de la mise à jour", { error });
  }

  return invoice;
});

// ============================================
// DELETE /api/invoices/:id - Supprimer facture
// ============================================
export const DELETE = withApiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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

  // Delete invoice (cascade will delete items)
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", params.id);
    
  if (error) {
    throw new DatabaseError("Erreur lors de la suppression", { error });
  }

  return { success: true };
});
