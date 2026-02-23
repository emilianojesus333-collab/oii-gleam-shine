import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_IDS = {
  monthly: "price_1T44idRuo9eGc2FAlyo3DpRd",
  annual: "price_1T44m4Ruo9eGc2FAPB6I6Wu7",
};

const formatPrice = (amount: number, currency: string): string => {
  const value = amount / 100;
  const symbol = currency.toUpperCase() === "EUR" ? "€" : currency.toUpperCase();
  return `${value.toFixed(2).replace(".", ",")}${symbol}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    // Log key prefix for debugging (safe - only first 12 chars)
    console.log("[GET-PRICING] Using key prefix:", stripeKey.substring(0, 12));

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Try each price individually for better error reporting
    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const [plan, priceId] of Object.entries(PRICE_IDS)) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        results[plan] = price;
        console.log(`[GET-PRICING] ${plan} price found:`, priceId, price.unit_amount);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors[plan] = msg;
        console.error(`[GET-PRICING] ${plan} price NOT found:`, priceId, msg);
      }
    }

    // If both failed, return error with details
    if (Object.keys(results).length === 0) {
      return new Response(JSON.stringify({ 
        error: "No prices found", 
        details: errors,
        hint: "Verify these Price IDs exist in your Stripe LIVE dashboard"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Build response with available prices
    const response: Record<string, any> = {};
    
    if (results.monthly) {
      const p = results.monthly;
      response.monthly = {
        price_id: PRICE_IDS.monthly,
        unit_amount: p.unit_amount || 0,
        currency: p.currency || "eur",
        interval: p.recurring?.interval || "month",
        formatted_price: formatPrice(p.unit_amount || 0, p.currency || "eur"),
        display_price: (p.unit_amount || 0) / 100,
      };
    }

    if (results.annual) {
      const p = results.annual;
      const annualAmount = p.unit_amount || 0;
      const monthlyEquiv = Math.round(annualAmount / 12);
      response.annual = {
        price_id: PRICE_IDS.annual,
        unit_amount: annualAmount,
        currency: p.currency || "eur",
        interval: p.recurring?.interval || "year",
        formatted_price: formatPrice(annualAmount, p.currency || "eur"),
        display_price: annualAmount / 100,
        monthly_equivalent: monthlyEquiv / 100,
        monthly_equivalent_formatted: formatPrice(monthlyEquiv, p.currency || "eur"),
      };
    }

    // Calculate savings if both exist
    if (results.monthly && results.annual) {
      const monthlyAmt = results.monthly.unit_amount || 0;
      const annualMonthly = Math.round((results.annual.unit_amount || 0) / 12);
      response.savings_percent = monthlyAmt > 0 
        ? Math.round((1 - annualMonthly / monthlyAmt) * 100) 
        : 0;
    }

    if (errors && Object.keys(errors).length > 0) {
      response.warnings = errors;
    }

    console.log("[GET-PRICING] Response:", JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[GET-PRICING] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
