export type Plan = "starter" | "pro" | "premium";
export type PlanStatus = "inactive" | "active" | "past_due" | "trialing" | "canceled" | null;

export const PLAN_ORDER: Plan[] = ["starter", "pro", "premium"];
export function gtePlan(a: Plan, b: Plan) {
  return PLAN_ORDER.indexOf(a) >= PLAN_ORDER.indexOf(b);
}

export const LIMITS: Record<Plan, {
  maxAppointmentsPerMonth: number | null; // null = illimité
  maxInvoicesPerMonth: number | null;
  maxMembers: number | null;
  smsQuotaMonth: number | null;
}> = {
  starter: { maxAppointmentsPerMonth: 100,  maxInvoicesPerMonth: 50,  maxMembers: 1,  smsQuotaMonth: 0 },
  pro:     { maxAppointmentsPerMonth: 500,  maxInvoicesPerMonth: 200, maxMembers: 5,  smsQuotaMonth: 100 },
  premium: { maxAppointmentsPerMonth: null, maxInvoicesPerMonth: null, maxMembers: 20, smsQuotaMonth: 1000 },
};

export type WorkspaceBilling = {
  id: string;
  plan: Plan | null;
  plan_status: PlanStatus;
  grace_until: string | null;
};
