import { NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const config = { api: { bodyParser: false } } as any; // Next.js (App Router ignore, mais on lit le raw body)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// util pour bufferiser le body brut
async function readRawBody(req: Request): Promise<Buffer> {
  const arr = await req.arrayBuffer();
  return Buffer.from(arr);
}

function planFromPriceId(priceId: string) {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "premium";
  return null;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req as any);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      /**
       * 1) Checkout terminé : session → customer + subscription
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;
        const metadata = session.metadata || {};
        const workspaceId = metadata.workspace_id || null;

        // si pas de workspace dans metadata, fallback: lookup par stripe customer
        let wsId = workspaceId as string | null;
        if (!wsId && customerId) {
          const { data: wsByCust } = await supabaseAdmin
            .from("workspaces")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          wsId = wsByCust?.id ?? null;
        }
        if (!wsId) break;

        // déterminer le plan depuis la subscription (price)
        let plan: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = (sub.items.data[0]?.price?.id) || "";
          plan = planFromPriceId(priceId);
        } else if (metadata.plan) {
          plan = String(metadata.plan);
        }

        await supabaseAdmin
          .from("workspaces")
          .update({
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId ?? null,
            plan: plan ?? null,
            plan_status: "active",
            grace_until: null
          })
          .eq("id", wsId);
        break;
      }

      /**
       * 2) Subscription modifiée (upgrade/downgrade / statut)
       */
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price?.id || "";
        const plan = planFromPriceId(priceId);
        const status = sub.status; // active | past_due | trialing | canceled | incomplete...

        // workspace par customer id
        const { data: ws } = await supabaseAdmin
          .from("workspaces")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (ws?.id) {
          await supabaseAdmin
            .from("workspaces")
            .update({
              stripe_subscription_id: sub.id,
              plan: plan ?? null,
              plan_status: status as any
            })
            .eq("id", ws.id);
        }
        break;
      }

      /**
       * 3) Paiement de facture échoué → plan_status past_due + période de grâce 7 jours
       */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: ws } = await supabaseAdmin
          .from("workspaces")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (ws?.id) {
          const grace = new Date();
          grace.setDate(grace.getDate() + 7); // 7 jours de grâce
          await supabaseAdmin
            .from("workspaces")
            .update({ plan_status: "past_due", grace_until: grace.toISOString() })
            .eq("id", ws.id);
        }
        break;
      }

      default:
        // ignorer silencieusement les autres événements
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (e: any) {
    return new Response(`Handler error: ${e.message}`, { status: 500 });
  }
}
