import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithAuth, waitForAuthReady } from "@/lib/supabaseHelpers";

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
    price_id: "price_1T44idRuo9eGc2FAlyo3DpRd",
    name: "LiftMate Pro Mensal",
    price: 4.99,
    interval: "mês",
  },
  annual: {
    price_id: "price_1T44m4Ruo9eGc2FAPB6I6Wu7",
    name: "LiftMate Pro Anual",
    price: 3.99,
    interval: "mês",
    total: 47.88,
  },
};

// Helper to check if subscription grants premium access
export const isPremiumStatus = (status: SubscriptionStatus, isTrialing: boolean): boolean => {
  return status === "active" || status === "canceled_but_active" || isTrialing;
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
  
  const checkingRef = useRef(false);
  const lastCheckRef = useRef<number>(0);

  // Check local database first for faster initial load
  const checkLocalSubscription = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[Subscription] Error checking local subscription:", error);
        return null;
      }

      if (data) {
        const now = new Date();
        const endDate = data.subscription_end_date ? new Date(data.subscription_end_date) : null;
        
        // CRITICAL: "active" status includes both active AND trialing from Stripe
        // Also consider any active/canceled_but_active status as premium
        if (data.status === "active" || data.status === "canceled_but_active") {
          // If we have an end date, check if it's still valid
          if (endDate) {
            if (endDate > now) {
              console.log("[Subscription] Local: active subscription found, valid until:", endDate);
              return {
                subscribed: true,
                status: data.status as SubscriptionStatus,
                subscriptionEnd: data.subscription_end_date,
                subscriptionStart: data.subscription_start_date,
                isTrialing: false, // Will be updated by Stripe sync
              };
            } else {
              console.log("[Subscription] Local: subscription expired on:", endDate);
              return {
                subscribed: false,
                status: "expired" as SubscriptionStatus,
                subscriptionEnd: data.subscription_end_date,
                subscriptionStart: data.subscription_start_date,
                isTrialing: false,
              };
            }
          } else {
            // No end date but status is active - consider valid
            console.log("[Subscription] Local: active status without end date");
            return {
              subscribed: true,
              status: data.status as SubscriptionStatus,
              subscriptionEnd: null,
              subscriptionStart: data.subscription_start_date,
              isTrialing: false,
            };
          }
        }
        
        return {
          subscribed: false,
          status: data.status as SubscriptionStatus,
          subscriptionEnd: data.subscription_end_date,
          subscriptionStart: data.subscription_start_date,
          isTrialing: false,
        };
      }
      
      return null;
    } catch (error) {
      console.error("[Subscription] Error in checkLocalSubscription:", error);
      return null;
    }
  }, []);

  const syncWithStripe = useCallback(async (silentMode: boolean = false): Promise<SubscriptionState | null> => {
    try {
      if (!silentMode) {
        console.log("[Subscription] Syncing with Stripe...");
      }

      const { data, error } = await invokeWithAuth<{
        subscribed: boolean;
        status: SubscriptionStatus;
        product_id: string | null;
        subscription_end: string | null;
        subscription_start: string | null;
        is_trialing: boolean;
      }>("check-subscription", { silentOn401: silentMode });

      // In silent mode, null data without error is expected for unauthenticated users
      if (silentMode && !data && !error) {
        return null;
      }

      if (error) {
        console.error("[Subscription] Error checking subscription with Stripe:", error);
        return null;
      }

      if (!data) {
        if (!silentMode) {
          console.error("[Subscription] No data returned from check-subscription");
        }
        return null;
      }

      console.log("[Subscription] Stripe response:", data);
      
      const newState: SubscriptionState = {
        isLoading: false,
        subscribed: data.subscribed || false,
        status: data.status || "never_subscribed",
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        subscriptionStart: data.subscription_start || null,
        isTrialing: data.is_trialing || false,
        error: null,
      };
      
      return newState;
    } catch (error) {
      if (!silentMode) {
        console.error("[Subscription] Error syncing with Stripe:", error);
      }
      return null;
    }
  }, []);

  const checkSubscription = useCallback(async (isInitialBoot: boolean = false) => {
    // Debounce: prevent multiple rapid checks
    const now = Date.now();
    if (now - lastCheckRef.current < 2000) {
      return;
    }
    
    if (checkingRef.current) {
      return;
    }
    
    checkingRef.current = true;
    lastCheckRef.current = now;
    
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // On initial boot (especially Capacitor), wait for auth to be ready
      if (isInitialBoot) {
        await waitForAuthReady(3000);
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Silently set default state - no logging needed for expected case
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
        console.log("[Subscription] Using local data - user has active subscription");
        setState({
          isLoading: false,
          subscribed: localData.subscribed,
          status: localData.status,
          productId: null,
          subscriptionEnd: localData.subscriptionEnd,
          subscriptionStart: localData.subscriptionStart,
          isTrialing: localData.isTrialing || false,
          error: null,
        });
        
        // Still sync with Stripe in background (silent mode for boot)
        syncWithStripe(isInitialBoot).then((stripeData) => {
          if (stripeData) {
            setState(stripeData);
          }
        });
        return;
      }

      // If no local active subscription, check Stripe directly (silent on boot)
      const stripeData = await syncWithStripe(isInitialBoot);
      if (stripeData) {
        setState(stripeData);
      } else {
        // Fallback to local data if Stripe fails
        setState((prev) => ({
          ...prev,
          isLoading: false,
          subscribed: localData?.subscribed || false,
          status: localData?.status || "never_subscribed",
        }));
      }
    } catch {
      // Silent error handling - just set loading to false
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    } finally {
      checkingRef.current = false;
    }
  }, [checkLocalSubscription, syncWithStripe]);

  const createCheckout = useCallback(async (priceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

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
        // Use location.href for reliable redirect (window.open may be blocked)
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("[Subscription] Error creating checkout:", error);
      throw error;
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

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
      console.error("[Subscription] Error opening customer portal:", error);
      throw error;
    }
  }, []);

  // Check if user should see paywall
  // CRITICAL: Never show paywall to users with active, canceled_but_active, OR trialing status
  const shouldShowPaywall = useCallback(() => {
    // Still loading - don't make a decision yet
    if (state.isLoading) {
      return false;
    }
    
    // If user is trialing, they have premium access
    if (state.isTrialing) {
      console.log("[Subscription] shouldShowPaywall: false (trialing)");
      return false;
    }
    
    // If user is subscribed, no paywall
    if (state.subscribed) {
      console.log("[Subscription] shouldShowPaywall: false (subscribed)");
      return false;
    }
    
    // If user has active or canceled_but_active status, no paywall
    if (state.status === "active" || state.status === "canceled_but_active") {
      console.log("[Subscription] shouldShowPaywall: false (active status)");
      return false;
    }
    
    // Only show paywall for never_subscribed or expired
    const showPaywall = state.status === "never_subscribed" || state.status === "expired";
    console.log("[Subscription] shouldShowPaywall:", showPaywall, "status:", state.status);
    return showPaywall;
  }, [state.status, state.isTrialing, state.subscribed, state.isLoading]);

  // Check if subscription is currently valid (including trial)
  const isSubscriptionValid = useCallback(() => {
    // CRITICAL: Trialing users have valid subscription
    if (state.isTrialing) {
      console.log("[Subscription] isSubscriptionValid: true (trialing)");
      return true;
    }
    
    // If subscribed flag is true, consider valid
    if (state.subscribed) {
      console.log("[Subscription] isSubscriptionValid: true (subscribed)");
      return true;
    }
    
    // Active or canceled_but_active with valid end date
    if (state.status === "active" || state.status === "canceled_but_active") {
      if (state.subscriptionEnd) {
        const isValid = new Date(state.subscriptionEnd) > new Date();
        console.log("[Subscription] isSubscriptionValid:", isValid, "end:", state.subscriptionEnd);
        return isValid;
      }
      // If no end date but status is active, consider valid
      console.log("[Subscription] isSubscriptionValid: true (active status, no end date)");
      return true;
    }
    
    console.log("[Subscription] isSubscriptionValid: false, status:", state.status);
    return false;
  }, [state.status, state.subscriptionEnd, state.isTrialing, state.subscribed]);

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

    // Initial boot check with auth-ready wait and silent 401 handling
    checkSubscription(true);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Reset ref to allow immediate check (not initial boot)
        lastCheckRef.current = 0;
        checkSubscription(false);
      }
    });

    // Auto-refresh every 15 minutes (reduced from 2min)
    const interval = setInterval(() => {
      lastCheckRef.current = 0;
      checkSubscription(false);
    }, 900000);

    // Also refresh when user returns to the tab/app
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        lastCheckRef.current = 0;
        checkSubscription(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
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
