import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { withApiHandler } from "@/lib/api/apiHandler";
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
} from "@/lib/errors/AppError";
import { verifyInvoiceAccess, markInvoiceAsPaid } from "@/lib/invoices/helpers";

export const dynamic = 'force-dynamic';

// ============================================
// PATCH /api/invoices/:id/payment - Enregistrer paiement
// ============================================
export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();
  
  // Validation
  if (!body.payment_method) {
    throw new ValidationError("Méthode de paiement requise");
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

  // Verify access
  await verifyInvoiceAccess(params.id, wm.workspace_id);

  // Mark as paid
  await markInvoiceAsPaid(params.id, body.payment_method, body.paid_at);

  return { success: true, message: "Paiement enregistré" };
});
