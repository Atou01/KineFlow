import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  subWeeks,
  isWithinInterval,
  addDays,
  formatISO
} from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // User + workspace
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: wm, error: wmErr } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (wmErr || !wm) return new Response("No workspace", { status: 400 });
  const workspaceId = wm.workspace_id;

  // Dates
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Lundi
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  // ----- Revenu total (payé) -----
  const { data: invAllPaid } = await supabase
    .from("invoices")
    .select("total_cents, issue_date, paid")
    .eq("workspace_id", workspaceId)
    .eq("paid", true);

  const totalRevenue = (invAllPaid || []).reduce((acc, r) => acc + (r.total_cents || 0), 0);

  // ----- Revenu ce mois (payé) -----
  const revenueThisMonth = (invAllPaid || [])
    .filter(r => new Date(r.issue_date) >= monthStart)
    .reduce((acc, r) => acc + (r.total_cents || 0), 0);

  // ----- Revenus hebdo (8 dernières semaines, payé) -----
  const start8 = subWeeks(weekStart, 7); // inclusif (8 semaines)
  const weeks: { label: string; startISO: string; endISO: string; total_cents: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const s = addDays(start8, i * 7);
    const e = endOfWeek(s, { weekStartsOn: 1 });
    weeks.push({
      label: formatISO(s, { representation: "date" }),
      startISO: s.toISOString(),
      endISO: e.toISOString(),
      total_cents: 0,
    });
  }
  (invAllPaid || []).forEach((r) => {
    const d = new Date(r.issue_date);
    for (const w of weeks) {
      if (isWithinInterval(d, { start: new Date(w.startISO), end: new Date(w.endISO) })) {
        w.total_cents += r.total_cents || 0;
        break;
      }
    }
  });

  // ----- Clients (total) -----
  const { count: clientsCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  // ----- RDV cette semaine -----
  const { count: apptsThisWeek } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .gte("date", weekStart.toISOString())
    .lte("date", weekEnd.toISOString());

  return Response.json({
    total_revenue_cents: totalRevenue,
    revenue_this_month_cents: revenueThisMonth,
    clients_count: clientsCount || 0,
    appointments_this_week: apptsThisWeek || 0,
    weekly_revenue: weeks.map(w => ({
      week_start: w.label,
      total_eur: Math.round(w.total_cents) / 100
    }))
  });
}
