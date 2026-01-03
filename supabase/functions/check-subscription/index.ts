import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Safe date conversion to prevent "Invalid time value" errors
const safeTimestampToISO = (timestamp: number | null | undefined): string | null => {
  if (!timestamp || typeof timestamp !== 'number') {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, check if user has a subscription record in our database
    const { data: existingSubscription } = await supabaseClient
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // If no record exists, create one
    if (!existingSubscription) {
      logStep("Creating new subscription record for user");
      await supabaseClient
        .from("user_subscriptions")
        .insert({ user_id: user.id, status: "never_subscribed" });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, user never subscribed");
      
      // Update database status to never_subscribed
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          status: "never_subscribed",
          subscription_start_date: null,
          subscription_end_date: null,
          stripe_customer_id: null,
          stripe_subscription_id: null,
        }, { onConflict: "user_id" });
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: "never_subscribed",
        subscription_end: null,
        is_trialing: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionStart = null;
    let isTrialing = false;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = allActiveSubscriptions[0];
      stripeSubscriptionId = subscription.id;
      isTrialing = subscription.status === "trialing";
      
      // Use safe timestamp conversion
      subscriptionEnd = safeTimestampToISO(subscription.current_period_end);
      subscriptionStart = safeTimestampToISO(subscription.current_period_start);
      
      // For trialing subscriptions, use trial_end if available
      if (isTrialing && subscription.trial_end) {
        const trialEnd = safeTimestampToISO(subscription.trial_end);
        if (trialEnd) {
          subscriptionEnd = trialEnd;
        }
      }
      
      // Check if subscription is canceled but still within paid period
      if (subscription.cancel_at_period_end) {
        status = "canceled_but_active";
      } else {
        status = "active";
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd, 
        isTrialing, 
        status,
        rawStatus: subscription.status
      });
      
      // Get product ID safely
      try {
        if (subscription.items?.data?.[0]?.price?.product) {
          productId = subscription.items.data[0].price.product as string;
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
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          status: status,
          subscription_start_date: subscriptionStart,
          subscription_end_date: subscriptionEnd,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
        }, { onConflict: "user_id" });
      
      logStep("Database updated", { status, subscriptionEnd, isTrialing });
    } catch (e) {
      logStep("Error updating database", { error: String(e) });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      status: status,
      product_id: productId,
      subscription_end: subscriptionEnd,
      subscription_start: subscriptionStart,
      is_trialing: isTrialing
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
