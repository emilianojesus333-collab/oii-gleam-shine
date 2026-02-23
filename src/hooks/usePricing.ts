import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlanPricing {
  price_id: string;
  unit_amount: number;
  currency: string;
  interval: string;
  formatted_price: string;
  display_price: number;
  monthly_equivalent?: number;
  monthly_equivalent_formatted?: string;
}

interface PricingData {
  monthly: PlanPricing;
  annual: PlanPricing;
  savings_percent: number;
}

interface UsePricingReturn {
  pricing: PricingData | null;
  isLoading: boolean;
  error: string | null;
}

export const usePricing = (): UsePricingReturn => {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-pricing");
        if (fnError) throw fnError;
        setPricing(data);
      } catch (err) {
        console.error("[usePricing] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load pricing");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, []);

  return { pricing, isLoading, error };
};
