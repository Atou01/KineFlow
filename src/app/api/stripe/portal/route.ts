import { NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWorkspaceIdForCurrentUser } from "@/lib/getWorkspaceForUser";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(_req: NextRequest) {
  const workspaceId = await getWorkspaceIdForCurrentUser();
  if (!workspaceId) return new Response("Unauthorized", { status: 401 });

  const { data: ws } = await supabaseAdmin
    .from("workspaces")
    .select("stripe_customer_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws?.stripe_customer_id) return new Response("No stripe customer", { status: 400 });

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`;
  const session = await stripe.billingPortal.sessions.create({
    customer: ws.stripe_customer_id,
    return_url: returnUrl,
  });

  return Response.json({ url: session.url });
}
