import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    // For now, we'll process without signature verification
    // In production, you should verify the webhook signature
    const event = JSON.parse(body) as Stripe.Event;
    
    logStep("Event received", { type: event.type, id: event.id });
    
    // Handle relevant events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", { 
          customerId: session.customer, 
          email: session.customer_email,
          subscriptionId: session.subscription 
        });
        
        // Get customer email to find user
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (customerEmail) {
          // Find user by email
          const { data: users } = await supabaseClient.auth.admin.listUsers();
          const user = users?.users?.find(u => u.email === customerEmail);
          
          if (user) {
            // Update subscription status immediately
            const subscriptionId = session.subscription as string;
            const customerId = session.customer as string;
            
            // Get subscription details from Stripe
            let subscriptionEnd = null;
            let subscriptionStart = null;
            let status: "active" | "canceled_but_active" = "active";
            
            if (subscriptionId) {
              try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
                subscriptionStart = new Date(subscription.current_period_start * 1000).toISOString();
                
                // Check if in trial
                if (subscription.status === "trialing") {
                  subscriptionEnd = subscription.trial_end 
                    ? new Date(subscription.trial_end * 1000).toISOString() 
                    : subscriptionEnd;
                }
              } catch (e) {
                logStep("Error fetching subscription details", { error: String(e) });
              }
            }
            
            const { error: upsertError } = await supabaseClient
              .from("user_subscriptions")
              .upsert({
                user_id: user.id,
                status: status,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                subscription_start_date: subscriptionStart,
                subscription_end_date: subscriptionEnd,
              }, { onConflict: "user_id" });
            
            if (upsertError) {
              logStep("Error updating subscription", { error: upsertError.message });
            } else {
              logStep("Subscription updated successfully", { userId: user.id, status });
            }
          } else {
            logStep("User not found for email", { email: customerEmail });
          }
        }
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
          customerId 
        });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const customerEmail = customer.email;
        
        if (customerEmail) {
          // Find user by email
          const { data: users } = await supabaseClient.auth.admin.listUsers();
          const user = users?.users?.find(u => u.email === customerEmail);
          
          if (user) {
            // Determine status
            let dbStatus: "active" | "expired" | "canceled_but_active" | "never_subscribed" = "never_subscribed";
            
            if (subscription.status === "active" || subscription.status === "trialing") {
              dbStatus = subscription.cancel_at_period_end ? "canceled_but_active" : "active";
            } else if (subscription.status === "canceled" || subscription.status === "past_due" || subscription.status === "unpaid") {
              // Check if still within paid period
              const endDate = new Date(subscription.current_period_end * 1000);
              if (endDate > new Date()) {
                dbStatus = "canceled_but_active";
              } else {
                dbStatus = "expired";
              }
            }
            
            // Calculate dates
            let subscriptionEnd = null;
            let subscriptionStart = null;
            
            try {
              if (subscription.current_period_end) {
                subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
              }
              if (subscription.current_period_start) {
                subscriptionStart = new Date(subscription.current_period_start * 1000).toISOString();
              }
              // For trialing, use trial_end as the end date
              if (subscription.status === "trialing" && subscription.trial_end) {
                subscriptionEnd = new Date(subscription.trial_end * 1000).toISOString();
              }
            } catch (e) {
              logStep("Error parsing dates", { error: String(e) });
            }
            
            const { error: upsertError } = await supabaseClient
              .from("user_subscriptions")
              .upsert({
                user_id: user.id,
                status: dbStatus,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscription.id,
                subscription_start_date: subscriptionStart,
                subscription_end_date: subscriptionEnd,
              }, { onConflict: "user_id" });
            
            if (upsertError) {
              logStep("Error updating subscription", { error: upsertError.message });
            } else {
              logStep("Subscription updated successfully", { userId: user.id, status: dbStatus });
            }
          } else {
            logStep("User not found for email", { email: customerEmail });
          }
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        logStep("Subscription deleted", { subscriptionId: subscription.id, customerId });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const customerEmail = customer.email;
        
        if (customerEmail) {
          // Find user by email
          const { data: users } = await supabaseClient.auth.admin.listUsers();
          const user = users?.users?.find(u => u.email === customerEmail);
          
          if (user) {
            const { error: upsertError } = await supabaseClient
              .from("user_subscriptions")
              .upsert({
                user_id: user.id,
                status: "expired",
                stripe_subscription_id: null,
              }, { onConflict: "user_id" });
            
            if (upsertError) {
              logStep("Error updating subscription", { error: upsertError.message });
            } else {
              logStep("Subscription marked as expired", { userId: user.id });
            }
          }
        }
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
