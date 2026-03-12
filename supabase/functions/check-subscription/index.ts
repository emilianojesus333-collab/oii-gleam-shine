import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Developer emails with full access (server-side validation)
const DEV_EMAILS = [
  "emilianojesus333@email.com",
  "emilianodejesusdafunseca99@gmail.com",
];

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Safe date conversion to prevent "Invalid time value" errors
const safeTimestampToISO = (timestamp: number | null | undefined): string | null => {
  if (!timestamp || typeof timestamp !== "number") {
    return null;
  }
  try {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
      logStep("Invalid timestamp", { timestamp });
      return null;
    }
    return date.toISOString();
  } catch (e) {
    logStep("Error converting timestamp", { timestamp, error: String(e) });
    return null;
  }
};

const unauthorized = (message = "Unauthorized") =>
  new Response(JSON.stringify({ error: message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 401,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Missing STRIPE_SECRET_KEY");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      // IMPORTANT: Don't throw here—mobile can briefly call before session is ready.
      logStep("Unauthorized: missing/invalid Authorization header");
      return unauthorized("Auth session missing");
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      logStep("Unauthorized: empty bearer token");
      return unauthorized("Auth session missing");
    }

    // IMPORTANT:
    // - Use anon key to validate user JWT (service role key can cause getUser/getClaims issues)
    // - Use service role client only for DB writes
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    logStep("Validating JWT claims");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep("Unauthorized: invalid claims", { error: claimsError?.message });
      return unauthorized("Unauthorized");
    }

    const userId = claimsData.claims.sub as string | undefined;
    const email = (claimsData.claims as Record<string, unknown>).email as string | undefined;

    if (!userId || !email) {
      logStep("Unauthorized: missing required claims", { hasUserId: !!userId, hasEmail: !!email });
      return unauthorized("Unauthorized");
    }

    logStep("User authenticated", { userId, email });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // First, check if user has a subscription record in our database
    const { data: existingSubscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // If no record exists, create one
    if (!existingSubscription) {
      logStep("Creating new subscription record for user");
      await supabaseAdmin.from("user_subscriptions").insert({ user_id: userId, status: "never_subscribed" });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, user never subscribed");

      // Update database status to never_subscribed
      await supabaseAdmin.from("user_subscriptions").upsert(
        {
          user_id: userId,
          status: "never_subscribed",
          subscription_start_date: null,
          subscription_end_date: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
        },
        { onConflict: "user_id" }
      );

      return new Response(
        JSON.stringify({
          subscribed: false,
          status: "never_subscribed",
          subscription_end: null,
          is_trialing: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Fetch all subscription types in parallel
    const [activeSubsResult, trialingSubsResult] = await Promise.all([
      stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      }),
      stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      }),
    ]);

    const allActiveSubscriptions = [...activeSubsResult.data, ...trialingSubsResult.data];
    const hasActiveSub = allActiveSubscriptions.length > 0;

    let status: "never_subscribed" | "active" | "expired" | "canceled_but_active" = "never_subscribed";
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let subscriptionStart: string | null = null;
    let isTrialing = false;
    let stripeSubscriptionId: string | null = null;

    if (hasActiveSub) {
      const subscription = allActiveSubscriptions[0];
      stripeSubscriptionId = subscription.id;
      isTrialing = subscription.status === "trialing";

      subscriptionEnd = safeTimestampToISO(subscription.current_period_end);
      subscriptionStart = safeTimestampToISO(subscription.current_period_start);

      // For trialing subscriptions, use trial_end if available
      if (isTrialing && subscription.trial_end) {
        const trialEnd = safeTimestampToISO(subscription.trial_end);
        if (trialEnd) subscriptionEnd = trialEnd;
      }

      // Check if subscription is canceled but still within paid period
      status = subscription.cancel_at_period_end ? "canceled_but_active" : "active";

      logStep("Active subscription found", {
        subscriptionId: subscription.id,
        endDate: subscriptionEnd,
        isTrialing,
        status,
        rawStatus: subscription.status,
      });

      // Get product ID safely
      try {
        const maybeProduct = subscription.items?.data?.[0]?.price?.product;
        if (typeof maybeProduct === "string") {
          productId = maybeProduct;
        }
      } catch (e) {
        logStep("Error getting product ID", { error: String(e) });
      }

      logStep("Determined subscription tier", { productId });
    } else {
      // Check if there was a past subscription (now expired)
      try {
        const pastSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 1,
        });

        if (pastSubscriptions.data.length > 0) {
          const lastSub = pastSubscriptions.data[0];
          const endTimestamp = lastSub.current_period_end;

          if (endTimestamp) {
            const endDate = new Date(endTimestamp * 1000);
            if (!isNaN(endDate.getTime()) && endDate < new Date()) {
              status = "expired";
              subscriptionEnd = endDate.toISOString();
              logStep("Subscription expired", { endDate: subscriptionEnd });
            }
          }
        }
      } catch (e) {
        logStep("Error checking past subscriptions", { error: String(e) });
      }

      logStep("No active subscription found", { status });
    }

    // Update database with current subscription status
    try {
      await supabaseAdmin.from("user_subscriptions").upsert(
        {
          user_id: userId,
          status,
          subscription_start_date: subscriptionStart,
          subscription_end_date: subscriptionEnd,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
        },
        { onConflict: "user_id" }
      );

      logStep("Database updated", { status, subscriptionEnd, isTrialing });
    } catch (e) {
      logStep("Error updating database", { error: String(e) });
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        status,
        product_id: productId,
        subscription_end: subscriptionEnd,
        subscription_start: subscriptionStart,
        is_trialing: isTrialing,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
