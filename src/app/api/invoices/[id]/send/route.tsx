import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { Resend } from "resend";
import { renderToStream } from "@react-pdf/renderer";
import { render } from "@react-email/components";
import { withApiHandler } from "@/lib/api/apiHandler";
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
} from "@/lib/errors/AppError";
import { verifyInvoiceAccess, markInvoiceAsSent } from "@/lib/invoices/helpers";
import { InvoicePDF } from "@/components/invoices/InvoicePDF";
import { InvoiceEmail } from "@/emails/InvoiceEmail";

export const dynamic = 'force-dynamic';

// Initialize Resend
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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

  // Get invoice with client details and items
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select(`
      *,
      client:clients (*),
      items:invoice_items (*)
    `)
    .eq("id", params.id)
    .single();
    
  if (invoiceError) {
    throw new DatabaseError("Erreur lors de la récupération", { error: invoiceError });
  }

  if (!invoice.client?.email) {
    throw new ValidationError("Le client n'a pas d'email");
  }

  // Get invoice settings for company info
  const { data: settings } = await supabase
    .from("invoice_settings")
    .select("*")
    .eq("workspace_id", wm.workspace_id)
    .maybeSingle();

  const companyInfo = settings ? {
    name: settings.company_name,
    address: settings.company_address,
    city: settings.company_city,
    phone: settings.company_phone,
    email: settings.company_email,
    siret: settings.company_siret,
    rpps: settings.company_rpps,
  } : undefined;

  // Generate PDF
  const pdfStream = await renderToStream(
    <InvoicePDF invoice={invoice} companyInfo={companyInfo} />
  );

  // Convert stream to buffer
  const chunks: Buffer[] = [];
  for await (const chunk of pdfStream) {
    chunks.push(Buffer.from(chunk));
  }
  const pdfBuffer = Buffer.concat(chunks);

  // Send email with Resend
  if (resend) {
    try {
      const emailHtml = await render(
        <InvoiceEmail 
          invoice={invoice} 
          companyName={companyInfo?.name}
        />
      );

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: companyInfo?.email || 'noreply@kineflow.app',
        to: invoice.client.email,
        subject: `Facture ${invoice.invoice_number}`,
        html: emailHtml,
        attachments: [
          {
            filename: `facture-${invoice.invoice_number}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      if (emailError) {
        throw new Error(`Erreur Resend: ${emailError.message}`);
      }

      // Mark as sent
      await markInvoiceAsSent(params.id);

      return { 
        success: true, 
        message: "Facture envoyée par email",
        emailId: emailData?.id,
      };
    } catch (error: any) {
      throw new DatabaseError("Erreur lors de l'envoi de l'email", { error });
    }
  } else {
    // Resend not configured, just mark as sent
    await markInvoiceAsSent(params.id);

    return { 
      success: true, 
      message: "Facture marquée comme envoyée (email non configuré)",
      warning: "Configurez RESEND_API_KEY pour activer l'envoi d'emails",
    };
  }
});
