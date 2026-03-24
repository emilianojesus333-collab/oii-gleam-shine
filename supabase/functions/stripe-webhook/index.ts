import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2?target=deno";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// O(1) user lookup by stripe_customer_id
async function findUserByCustomerId(
  supabase: ReturnType<typeof createClient>,
  customerId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    logStep("Error looking up user by stripe_customer_id", { error: error.message });
    return null;
  }
  return data?.user_id ?? null;
}

// Upsert subscription record
async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  params: {
    userId: string;
    status: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    renewalAttempts?: number;
    lastAttemptDate?: string | null;
  }
) {
  const upsertData: Record<string, unknown> = {
    user_id: params.userId,
    status: params.status,
    stripe_customer_id: params.stripeCustomerId,
    stripe_subscription_id: params.stripeSubscriptionId,
    subscription_start_date: params.startDate,
    subscription_end_date: params.endDate,
  };

  if (params.renewalAttempts !== undefined) {
    upsertData.renewal_attempts = params.renewalAttempts;
    upsertData.last_attempt_date = params.lastAttemptDate;
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert(upsertData, { onConflict: "user_id" });

  if (error) {
    logStep("Error upserting subscription", { error: error.message });
  } else {
    logStep("Subscription upserted", { userId: params.userId, status: params.status });
  }
}

// Get current renewal attempts for a user
async function getRenewalAttempts(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("renewal_attempts")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.renewal_attempts ?? 0;
}

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ── STEP 1: Read raw body + signature ──
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logStep("REJECTED: Missing stripe-signature header");
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // ── STEP 2: Verify signature (SECURITY CRITICAL) ──
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logStep("REJECTED: Invalid Stripe signature", { error: msg });
      return new Response("Invalid signature", { status: 400 });
    }

    // ── STEP 3: Process verified event ──
    logStep("Verified event", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        // client_reference_id is the user_id passed during checkout creation
        const userId = session.client_reference_id;

        logStep("Checkout completed", { customerId, subscriptionId, userId });

        if (!userId) {
          logStep("No client_reference_id (user_id) in session, skipping");
          break;
        }

        // Fetch subscription details from Stripe
        let endDate: string | null = null;
        let startDate: string | null = null;

        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            startDate = new Date(sub.current_period_start * 1000).toISOString();
            endDate = sub.status === "trialing" && sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : new Date(sub.current_period_end * 1000).toISOString();
          } catch (e) {
            logStep("Error fetching subscription", { error: String(e) });
          }
        }

        await upsertSubscription(supabaseClient, {
          userId,
          status: "active",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          startDate,
          endDate,
          renewalAttempts: 0,
          lastAttemptDate: null,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        logStep("Subscription event", {
          type: event.type,
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId,
        });

        // O(1) lookup by stripe_customer_id
        const userId = await findUserByCustomerId(supabaseClient, customerId);
        if (!userId) {
          logStep("No user found for stripe_customer_id", { customerId });
          break;
        }

        // Determine DB status
        let dbStatus: string = "never_subscribed";
        let resetAttempts = false;

        if (subscription.status === "active" || subscription.status === "trialing") {
          dbStatus = subscription.cancel_at_period_end ? "canceled_but_active" : "active";
          resetAttempts = true; // Successful renewal — reset counter
        } else if (subscription.status === "past_due") {
          dbStatus = "active"; // Still active during retry period
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid"
        ) {
          const endDate = new Date(subscription.current_period_end * 1000);
          dbStatus = endDate > new Date() ? "canceled_but_active" : "expired";
        }

        let startDate: string | null = null;
        let endDate: string | null = null;
        if (subscription.current_period_start) {
          startDate = new Date(subscription.current_period_start * 1000).toISOString();
        }
        if (subscription.current_period_end) {
          endDate = new Date(subscription.current_period_end * 1000).toISOString();
        }
        if (subscription.status === "trialing" && subscription.trial_end) {
          endDate = new Date(subscription.trial_end * 1000).toISOString();
        }

        const upsertParams: Parameters<typeof upsertSubscription>[1] = {
          userId,
          status: dbStatus,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          startDate,
          endDate,
        };

        if (resetAttempts) {
          upsertParams.renewalAttempts = 0;
          upsertParams.lastAttemptDate = null;
        }

        await upsertSubscription(supabaseClient, upsertParams);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        logStep("Subscription deleted", { subscriptionId: subscription.id, customerId });

        const userId = await findUserByCustomerId(supabaseClient, customerId);
        if (!userId) {
          logStep("No user found for stripe_customer_id", { customerId });
          break;
        }

        await upsertSubscription(supabaseClient, {
          userId,
          status: "expired",
          stripeCustomerId: customerId,
          stripeSubscriptionId: null,
        });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
