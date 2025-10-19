import { NextRequest } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getWorkspaceIdForCurrentUser } from "@/lib/getWorkspaceForUser";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const plan: "starter" | "pro" | "premium" = body.plan;

    const priceMap: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_STARTER!,
      pro: process.env.STRIPE_PRICE_PRO!,
      premium: process.env.STRIPE_PRICE_PREMIUM!,
    };
    const priceId = priceMap[plan];
    if (!priceId) return new Response("Invalid plan", { status: 400 });

    // User + workspace
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const workspaceId = await getWorkspaceIdForCurrentUser();
    if (!workspaceId) return new Response("No workspace", { status: 400 });

    // Retrieve or create Stripe Customer for this workspace
    const { data: ws, error: wsErr } = await supabaseAdmin
      .from("workspaces")
      .select("id, name, stripe_customer_id, plan")
      .eq("id", workspaceId)
      .maybeSingle();
    if (wsErr || !ws) return new Response("Workspace error", { status: 400 });

    let customerId = ws.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: ws.name || undefined,
        metadata: { workspace_id: ws.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("id", workspaceId);
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app/dashboard?checkout=success`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?checkout=cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { workspace_id: workspaceId, plan },
    });

    return Response.json({ url: session.url });
  } catch (e: any) {
    return new Response(e.message || "Checkout error", { status: 500 });
  }
}
