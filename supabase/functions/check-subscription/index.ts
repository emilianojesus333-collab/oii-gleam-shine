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

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    // Check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });
    
    // Check for canceled but still active subscriptions
    const canceledSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "canceled",
      limit: 1,
    });
    
    const allActiveSubscriptions = [...subscriptions.data, ...trialingSubscriptions.data];
    const hasActiveSub = allActiveSubscriptions.length > 0;
    
    let status: "never_subscribed" | "active" | "expired" | "canceled_but_active" = "never_subscribed";
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionStart = null;
    let isTrialing = false;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = allActiveSubscriptions[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionStart = new Date(subscription.current_period_start * 1000).toISOString();
      isTrialing = subscription.status === "trialing";
      stripeSubscriptionId = subscription.id;
      
      // Check if subscription is canceled but still within paid period
      if (subscription.cancel_at_period_end) {
        status = "canceled_but_active";
      } else {
        status = "active";
      }
      
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd, isTrialing, status });
      productId = subscription.items.data[0].price.product;
      logStep("Determined subscription tier", { productId });
    } else {
      // Check if there was a past subscription (now expired)
      const pastSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });
      
      if (pastSubscriptions.data.length > 0) {
        const lastSub = pastSubscriptions.data[0];
        const endDate = new Date(lastSub.current_period_end * 1000);
        
        if (endDate < new Date()) {
          status = "expired";
          subscriptionEnd = endDate.toISOString();
          logStep("Subscription expired", { endDate: subscriptionEnd });
        }
      }
      
      logStep("No active subscription found", { status });
    }

    // Update database with current subscription status
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
    
    logStep("Database updated", { status, subscriptionEnd });

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