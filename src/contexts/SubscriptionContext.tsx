import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
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
  isDeveloper: boolean;
  error: string | null;
}

interface SubscriptionContextValue extends SubscriptionState {
  checkSubscription: (isInitialBoot?: boolean) => Promise<void>;
  createCheckout: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  shouldShowPaywall: () => boolean;
  isSubscriptionValid: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const DEFAULT_STATE: SubscriptionState = {
  isLoading: true,
  subscribed: false,
  status: "never_subscribed",
  productId: null,
  subscriptionEnd: null,
  subscriptionStart: null,
  isTrialing: false,
  isDeveloper: false,
  error: null,
};

// Deep comparison of subscription state (excluding isLoading/error)
function stateChanged(prev: SubscriptionState, next: SubscriptionState): boolean {
  return (
    prev.subscribed !== next.subscribed ||
    prev.status !== next.status ||
    prev.productId !== next.productId ||
    prev.subscriptionEnd !== next.subscriptionEnd ||
    prev.subscriptionStart !== next.subscriptionStart ||
    prev.isTrialing !== next.isTrialing ||
    prev.isDeveloper !== next.isDeveloper
  );
}

export const SubscriptionProvider = ({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) => {
  const [state, setState] = useState<SubscriptionState>({ ...DEFAULT_STATE, isLoading: enabled });
  const checkingRef = useRef(false);
  const lastCheckRef = useRef<number>(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Safe setState that skips if data is identical
  const safeSetState = useCallback((newState: SubscriptionState) => {
    setState(prev => {
      if (!stateChanged(prev, newState) && prev.isLoading === newState.isLoading) {
        return prev; // No change, skip re-render
      }
      return newState;
    });
  }, []);

  const checkLocalSubscription = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !data) return null;

      const now = new Date();
      const endDate = data.subscription_end_date ? new Date(data.subscription_end_date) : null;

      if (data.status === "active" || data.status === "canceled_but_active") {
        if (endDate && endDate <= now) {
          return { subscribed: false, status: "expired" as SubscriptionStatus, subscriptionEnd: data.subscription_end_date, subscriptionStart: data.subscription_start_date, isTrialing: false };
        }
        return { subscribed: true, status: data.status as SubscriptionStatus, subscriptionEnd: data.subscription_end_date, subscriptionStart: data.subscription_start_date, isTrialing: false };
      }

      return { subscribed: false, status: data.status as SubscriptionStatus, subscriptionEnd: data.subscription_end_date, subscriptionStart: data.subscription_start_date, isTrialing: false };
    } catch {
      return null;
    }
  }, []);

  const syncWithStripe = useCallback(async (silentMode: boolean = false) => {
    try {
      const { data, error } = await invokeWithAuth<{
        subscribed: boolean;
        status: SubscriptionStatus;
        product_id: string | null;
        subscription_end: string | null;
        subscription_start: string | null;
        is_trialing: boolean;
        is_developer?: boolean;
      }>("check-subscription", { silentOn401: silentMode });

      if (silentMode && !data && !error) return null;
      if (error || !data) return null;

      return {
        isLoading: false,
        subscribed: data.subscribed || false,
        status: data.status || "never_subscribed",
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        subscriptionStart: data.subscription_start || null,
        isTrialing: data.is_trialing || false,
        isDeveloper: data.is_developer || false,
        error: null,
      } as SubscriptionState;
    } catch {
      return null;
    }
  }, []);

  const checkSubscription = useCallback(async (isInitialBoot: boolean = false) => {
    const now = Date.now();
    if (now - lastCheckRef.current < 5000) return;
    if (checkingRef.current) return;

    checkingRef.current = true;
    lastCheckRef.current = now;

    try {
      safeSetState({ ...stateRef.current, isLoading: true, error: null });

      if (isInitialBoot) {
        await waitForAuthReady(3000);
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        safeSetState({ ...DEFAULT_STATE, isLoading: false });
        return;
      }

      // Check local first
      const localData = await checkLocalSubscription(session.user.id);

      if (localData?.subscribed) {
        safeSetState({
          isLoading: false,
          subscribed: localData.subscribed,
          status: localData.status,
          productId: null,
          subscriptionEnd: localData.subscriptionEnd,
          subscriptionStart: localData.subscriptionStart,
          isTrialing: localData.isTrialing,
          error: null,
        });

        // Background sync — only update if different
        syncWithStripe(isInitialBoot).then((stripeData) => {
          if (stripeData && stateChanged(stateRef.current, stripeData)) {
            safeSetState(stripeData);
          }
        });
        return;
      }

      // Stripe directly
      const stripeData = await syncWithStripe(isInitialBoot);
      if (stripeData) {
        safeSetState(stripeData);
      } else {
        safeSetState({
          ...DEFAULT_STATE,
          isLoading: false,
          subscribed: localData?.subscribed || false,
          status: localData?.status || "never_subscribed",
        });
      }
    } catch {
      safeSetState({ ...stateRef.current, isLoading: false });
    } finally {
      checkingRef.current = false;
    }
  }, [checkLocalSubscription, syncWithStripe, safeSetState]);

  const createCheckout = useCallback(async (priceId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Precisa estar logado para assinar.");

    const { data, error } = await supabase.functions.invoke("create-checkout", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL received");
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Precisa estar logado para gerir a subscrição.");

    const { data, error } = await supabase.functions.invoke("customer-portal", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    if (data?.url) window.open(data.url, "_blank");
  }, []);

  const shouldShowPaywall = useCallback(() => {
    if (state.isLoading || state.isTrialing || state.subscribed) return false;
    if (state.status === "active" || state.status === "canceled_but_active") return false;
    return state.status === "never_subscribed" || state.status === "expired";
  }, [state.status, state.isTrialing, state.subscribed, state.isLoading]);

  const isSubscriptionValid = useCallback(() => {
    if (state.isTrialing || state.subscribed) return true;
    if (state.status === "active" || state.status === "canceled_but_active") {
      if (state.subscriptionEnd) return new Date(state.subscriptionEnd) > new Date();
      return true;
    }
    return false;
  }, [state.status, state.subscriptionEnd, state.isTrialing, state.subscribed]);

  useEffect(() => {
    if (!enabled) {
      safeSetState({ ...DEFAULT_STATE, isLoading: false });
      return;
    }

    checkSubscription(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        lastCheckRef.current = 0;
        checkSubscription(false);
      }
      if (event === 'SIGNED_OUT') {
        safeSetState({ ...DEFAULT_STATE, isLoading: false });
      }
    });

    // NO setInterval — subscription is only checked on auth events and manual triggers

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSubscription, enabled, safeSetState]);

  return (
    <SubscriptionContext.Provider value={{
      ...state,
      checkSubscription,
      createCheckout,
      openCustomerPortal,
      shouldShowPaywall,
      isSubscriptionValid,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscriptionContext must be used within SubscriptionProvider");
  }
  return ctx;
};
