import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionState {
  isLoading: boolean;
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isTrialing: boolean;
  error: string | null;
}

export const SUBSCRIPTION_PRODUCTS = {
  monthly: {
    price_id: "price_1SjhSfRtkQ9T14tbDHg54eTm",
    product_id: "prod_Th5daOufUJxfNM",
    name: "LiftMate Pro Mensal",
    price: 12.99,
    interval: "mês",
  },
  annual: {
    price_id: "price_1SjhT3RtkQ9T14tbbKxeAxKr",
    product_id: "prod_Th5eYkDpvoZKIX",
    name: "LiftMate Pro Anual",
    price: 7.99,
    interval: "mês",
    total: 95.88,
  },
};

export const useSubscription = () => {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    isTrialing: false,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState({
          isLoading: false,
          subscribed: false,
          productId: null,
          subscriptionEnd: null,
          isTrialing: false,
          error: null,
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("Error checking subscription:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return;
      }

      setState({
        isLoading: false,
        subscribed: data.subscribed || false,
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        isTrialing: data.is_trialing || false,
        error: null,
      });
    } catch (error) {
      console.error("Error in checkSubscription:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  const createCheckout = useCallback(async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      throw error;
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    checkSubscription();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    // Auto-refresh every minute
    const interval = setInterval(checkSubscription, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [checkSubscription]);

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};
