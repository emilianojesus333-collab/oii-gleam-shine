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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const [monthlyPrice, annualPrice] = await Promise.all([
      stripe.prices.retrieve(PRICE_IDS.monthly, { expand: ["product"] }),
      stripe.prices.retrieve(PRICE_IDS.annual, { expand: ["product"] }),
    ]);

    const monthlyAmount = monthlyPrice.unit_amount || 0;
    const annualAmount = annualPrice.unit_amount || 0;
    const annualMonthlyEquivalent = Math.round(annualAmount / 12);
    const monthlyCurrency = monthlyPrice.currency || "eur";
    const annualCurrency = annualPrice.currency || "eur";

    const savingsPercent =
      monthlyAmount > 0
        ? Math.round((1 - annualMonthlyEquivalent / monthlyAmount) * 100)
        : 0;

    const response = {
      monthly: {
        price_id: PRICE_IDS.monthly,
        unit_amount: monthlyAmount,
        currency: monthlyCurrency,
        interval: monthlyPrice.recurring?.interval || "month",
        formatted_price: formatPrice(monthlyAmount, monthlyCurrency),
        display_price: monthlyAmount / 100,
      },
      annual: {
        price_id: PRICE_IDS.annual,
        unit_amount: annualAmount,
        currency: annualCurrency,
        interval: annualPrice.recurring?.interval || "year",
        formatted_price: formatPrice(annualAmount, annualCurrency),
        display_price: annualAmount / 100,
        monthly_equivalent: annualMonthlyEquivalent / 100,
        monthly_equivalent_formatted: formatPrice(annualMonthlyEquivalent, annualCurrency),
      },
      savings_percent: savingsPercent,
    };

    console.log("[GET-PRICING] Prices fetched successfully", response);

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
