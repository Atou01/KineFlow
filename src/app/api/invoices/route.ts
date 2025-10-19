import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { nextInvoiceNumber } from "@/lib/invoices";
import { enforceQuota } from "@/lib/billing";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Récupérer workspace_id via membership le plus récent (MVP)
  const { data: wm } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) return new Response("No workspace", { status: 400 });

  const { data, error } = await supabase.from("invoices")
    .select("id, number, issue_date, total_cents, paid")
    .eq("workspace_id", wm.workspace_id)
    .order("created_at", { ascending: false });
  if (error) return new Response(error.message, { status: 400 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const quota = await enforceQuota("invoices", "issue_date");
  if (!quota.allowed) {
    return Response.json(
      { error: quota.reason, upgrade_url: "/app/billing" },
      { status: 402 }
    );
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: wm } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) return new Response("No workspace", { status: 400 });

  // settings pour prefix
  const { data: st } = await supabase.from("settings")
    .select("invoice_prefix").eq("workspace_id", wm.workspace_id).maybeSingle();
  const prefix = st?.invoice_prefix || "INV-";

  // calcul rapide (MVP)
  const items = Array.isArray(body.items) ? body.items : [];
  const subtotal = items.reduce((acc:number, it:any) => acc + (Number(it.qty||1) * Number(it.unit_price_cents||0)), 0);
  const taxRate = Number(body.tax_rate || 0);
  const total = Math.round(subtotal * (1 + taxRate/100));

  // trouver le prochain numéro (compte les factures existantes année en cours)
  const year = new Date().getFullYear();
  const { data: existing } = await supabase.from("invoices")
    .select("id").eq("workspace_id", wm.workspace_id)
    .like("number", `${prefix}${year}-%`);
  const seq = (existing?.length || 0) + 1;
  const number = nextInvoiceNumber(prefix, new Date(), seq);

  const { data: ins, error } = await supabase.from("invoices").insert({
    workspace_id: wm.workspace_id,
    client_id: body.client_id ?? null,
    number,
    issue_date: body.issue_date ?? new Date().toISOString().slice(0,10),
    due_date: body.due_date ?? null,
    subtotal_cents: subtotal,
    tax_rate: taxRate,
    total_cents: total,
    paid: false
  }).select("id").maybeSingle();
  if (error) return new Response(error.message, { status: 400 });

  if (items.length && ins?.id) {
    const rows = items.map((it:any)=> ({
      invoice_id: ins.id,
      description: String(it.description||"Ligne"),
      qty: Number(it.qty||1),
      unit_price_cents: Number(it.unit_price_cents||0),
      total_cents: Number(it.qty||1) * Number(it.unit_price_cents||0)
    }));
    const { error: e2 } = await supabase.from("invoice_items").insert(rows);
    if (e2) return new Response(e2.message, { status: 400 });
  }

  return Response.json({ id: ins?.id, number });
}
