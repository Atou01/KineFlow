import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: wm } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) return new Response("No workspace", { status: 400 });

  const { data, error } = await supabase.from("invoices")
    .select("number, issue_date, total_cents, paid")
    .eq("workspace_id", wm.workspace_id)
    .order("issue_date", { ascending: true });
  if (error) return new Response(error.message, { status: 400 });

  const header = "number,issue_date,total_eur,paid\n";
  const rows = (data||[]).map(r => `${r.number},${r.issue_date},${(r.total_cents/100).toFixed(2)},${r.paid}`);
  const csv = header + rows.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=invoices.csv"
    }
  });
}
