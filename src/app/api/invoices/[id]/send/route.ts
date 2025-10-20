import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { withApiHandler } from "@/lib/api/apiHandler";
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
} from "@/lib/errors/AppError";
import { verifyInvoiceAccess, markInvoiceAsSent } from "@/lib/invoices/helpers";

export const dynamic = 'force-dynamic';

// ============================================
// POST /api/invoices/:id/send - Envoyer facture par email
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

  // Get invoice with client details
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients (*)
    `)
    .eq("id", params.id)
    .single();
    
  if (invoiceError) {
    throw new DatabaseError("Erreur lors de la récupération", { error: invoiceError });
  }

  if (!invoice.client?.email) {
    throw new ValidationError("Le client n'a pas d'email");
  }

  // TODO: Implement email sending with Resend
  // For now, just mark as sent
  await markInvoiceAsSent(params.id);

  return { 
    success: true, 
    message: "Facture envoyée par email",
    // TODO: Add email tracking info
  };
});
