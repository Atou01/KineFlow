import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { startOfMonth } from "date-fns";
import { LIMITS, Plan, WorkspaceBilling } from "./plan";

export async function getCurrentWorkspaceBilling():
  Promise<WorkspaceBilling & { membersCount: number }>
{
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: wm } = await supabase
    .from("workspace_members")
    .select("workspace_id").eq("user_id", user.id)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!wm) throw new Error("No workspace");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, plan, plan_status, grace_until")
    .eq("id", wm.workspace_id).maybeSingle();
  if (!ws) throw new Error("Workspace not found");

  const { count: membersCount } = await supabase
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ws.id);

  return { ...ws, membersCount: membersCount ?? 0 } as any;
}

export function isBlocked(status: string | null, grace_until: string | null) {
  if (status === "inactive" || status === "canceled") return true;
  if (status === "past_due" && grace_until && new Date(grace_until) < new Date()) return true;
  return false;
}

export async function enforceQuota(
  table: "appointments" | "invoices",
  dateColumn: "date" | "issue_date",
) {
  const supabase = createRouteHandlerClient({ cookies });
  const ws = await getCurrentWorkspaceBilling();

  // Bloquer si statut non valide
  if (isBlocked(ws.plan_status, ws.grace_until)) {
    return { allowed: false, reason: "subscription_blocked", upgrade_url: "/app/billing" };
  }

  const plan = (ws.plan || "starter") as Plan;
  const limits = LIMITS[plan];

  // Membres
  if (limits.maxMembers !== null && ws.membersCount > limits.maxMembers) {
    return { allowed: false, reason: "members_limit", upgrade_url: "/app/billing" };
  }

  // Quotas mensuels
  const max =
    table === "appointments" ? limits.maxAppointmentsPerMonth : limits.maxInvoicesPerMonth;

  if (max === null) return { allowed: true };

  const monthStart = startOfMonth(new Date()).toISOString();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte(dateColumn, monthStart)
    .eq("workspace_id", ws.id);

  if ((count ?? 0) >= max) {
    return { allowed: false, reason: "quota_reached", upgrade_url: "/app/billing" };
  }
  return { allowed: true };
}
