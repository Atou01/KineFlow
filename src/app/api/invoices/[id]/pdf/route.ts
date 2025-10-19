import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { fmt } from "@/lib/money";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: inv, error } = await supabase
    .from("invoices")
    .select("id, number, issue_date, total_cents, subtotal_cents, tax_rate, client_id, workspace_id")
    .eq("id", params.id)
    .maybeSingle();
  if (error || !inv) return new Response("Not found", { status: 404 });

  const { data: items } = await supabase
    .from("invoice_items")
    .select("description, qty, unit_price_cents, total_cents")
    .eq("invoice_id", inv.id);

  const { data: client } = await supabase
    .from("clients")
    .select("first_name, last_name, email, phone")
    .eq("id", inv.client_id)
    .maybeSingle();

  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c as Buffer));
  const done = new Promise<Buffer>((res) => doc.on("end", () => res(Buffer.concat(chunks))));

  doc.fontSize(20).text("Facture", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`N° : ${inv.number}`);
  doc.text(`Date : ${new Date(inv.issue_date).toLocaleDateString("fr-FR")}`);
  if (client) doc.text(`Client : ${client.first_name} ${client.last_name}`);
  doc.moveDown();

  doc.text("Détails :");
  (items || []).forEach((it) => {
    doc.text(`- ${it.description}  x${it.qty}  ${fmt(it.total_cents)}`);
  });
  doc.moveDown();
  doc.text(`Sous-total : ${fmt(inv.subtotal_cents)}`);
  doc.text(`TVA (${inv.tax_rate}%): ${fmt(Math.round(inv.subtotal_cents * (inv.tax_rate/100)))}`);
  doc.fontSize(14).text(`Total : ${fmt(inv.total_cents)}`, { underline: true });

  doc.end();

  // Attendre le buffer final généré par pdfkit
  const pdfBuffer = await done; // Buffer<...>

  // ✅ Utiliser Uint8Array au lieu de Buffer/Blob pour Response
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${params.id}.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
