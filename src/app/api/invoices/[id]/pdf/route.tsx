import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoices/InvoicePDF";
import {
  AuthenticationError,
  ValidationError,
  DatabaseError,
} from "@/lib/errors/AppError";
import { verifyInvoiceAccess } from "@/lib/invoices/helpers";

export const dynamic = 'force-dynamic';

// ============================================
// GET /api/invoices/:id/pdf - Générer PDF
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    const stream = await renderToStream(
      <InvoicePDF invoice={invoice} companyInfo={companyInfo} />
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error("PDF generation error:", error);
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || "Erreur lors de la génération du PDF",
        code: error.code || "PDF_ERROR",
      },
      { status: error.statusCode || 500 }
    );
  }
}
