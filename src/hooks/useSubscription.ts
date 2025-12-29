import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionStatus = "never_subscribed" | "active" | "expired" | "canceled_but_active";

interface SubscriptionState {
  isLoading: boolean;
  subscribed: boolean;
  status: SubscriptionStatus;
  productId: string | null;
  subscriptionEnd: string | null;
  subscriptionStart: string | null;
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

export const useSubscription = (enabled: boolean = true) => {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: enabled,
    subscribed: false,
    status: "never_subscribed",
    productId: null,
    subscriptionEnd: null,
    subscriptionStart: null,
    isTrialing: false,
    error: null,
  });

  // Check local database first for faster initial load
  const checkLocalSubscription = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking local subscription:", error);
        return null;
      }

      if (data) {
        const now = new Date();
        const endDate = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
        
        // If we have local data and subscription is active (end date in future)
        if (data.status === "active" || data.status === "canceled_but_active") {
          if (endDate && endDate > now) {
            return {
              subscribed: true,
              status: data.status as SubscriptionStatus,
              subscriptionEnd: data.subscription_end_date,
              subscriptionStart: data.subscription_start_date,
            };
          } else if (endDate && endDate <= now) {
            // Subscription has expired, update local state
            return {
              subscribed: false,
              status: "expired" as SubscriptionStatus,
              subscriptionEnd: data.subscription_end_date,
              subscriptionStart: data.subscription_start_date,
            };
          }
        }
        
        return {
          subscribed: false,
          status: data.status as SubscriptionStatus,
          subscriptionEnd: data.subscription_end_date,
          subscriptionStart: data.subscription_start_date,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error in checkLocalSubscription:", error);
      return null;
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setState({
          isLoading: false,
          subscribed: false,
          status: "never_subscribed",
          productId: null,
          subscriptionEnd: null,
          subscriptionStart: null,
          isTrialing: false,
          error: null,
        });
        return;
      }

      // First, check local database for fast response
      const localData = await checkLocalSubscription(session.user.id);
      if (localData && localData.subscribed) {
        // User has active subscription in local DB, show immediately
        setState({
          isLoading: false,
          subscribed: localData.subscribed,
          status: localData.status,
          productId: null,
          subscriptionEnd: localData.subscriptionEnd,
          subscriptionStart: localData.subscriptionStart,
          isTrialing: false,
          error: null,
        });
        
        // Still sync with Stripe in background
        syncWithStripe(session.access_token);
        return;
      }

      // If no local active subscription, check Stripe
      await syncWithStripe(session.access_token);
    } catch (error) {
      console.error("Error in checkSubscription:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [checkLocalSubscription]);

  const syncWithStripe = async (accessToken: string) => {
    try {
      const authHeaders = { Authorization: `Bearer ${accessToken}` };

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: authHeaders,
      });

      if (error) {
        console.error("Error checking subscription with Stripe:", error);
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
        status: data.status || "never_subscribed",
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        subscriptionStart: data.subscription_start || null,
        isTrialing: data.is_trialing || false,
        error: null,
      });
    } catch (error) {
      console.error("Error syncing with Stripe:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  const createCheckout = useCallback(async (priceId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Precisa estar logado para assinar.");
      }

      const authHeaders = { Authorization: `Bearer ${session.access_token}` };

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: authHeaders,
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Precisa estar logado para gerir a subscrição.");
      }

      const authHeaders = { Authorization: `Bearer ${session.access_token}` };

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: authHeaders,
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      throw error;
    }
  }, []);

  // Check if user should see paywall
  const shouldShowPaywall = useCallback(() => {
    // Only show paywall if status is "never_subscribed" or "expired"
    return state.status === "never_subscribed" || state.status === "expired";
  }, [state.status]);

  // Check if subscription is currently valid
  const isSubscriptionValid = useCallback(() => {
    if (state.status === "active" || state.status === "canceled_but_active") {
      if (state.subscriptionEnd) {
        return new Date(state.subscriptionEnd) > new Date();
      }
    }
    return false;
  }, [state.status, state.subscriptionEnd]);

  useEffect(() => {
    if (!enabled) {
      setState({
        isLoading: false,
        subscribed: false,
        status: "never_subscribed",
        productId: null,
        subscriptionEnd: null,
        subscriptionStart: null,
        isTrialing: false,
        error: null,
      });
      return;
    }

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
  }, [checkSubscription, enabled]);

  return {
    ...state,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    shouldShowPaywall,
    isSubscriptionValid,
  };
};