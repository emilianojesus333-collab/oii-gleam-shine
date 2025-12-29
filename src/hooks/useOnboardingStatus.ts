import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface OnboardingStatus {
  session: Session | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean | null;
  isLoading: boolean;
}

export const useOnboardingStatus = () => {
  const [status, setStatus] = useState<OnboardingStatus>({
    session: null,
    isAuthenticated: false,
    hasCompletedOnboarding: null,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    const fetchOnboardingStatus = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("has_completed_onboarding")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching onboarding status:", error);
          return false;
        }

        // If no record exists, user hasn't completed onboarding
        return data?.has_completed_onboarding ?? false;
      } catch (error) {
        console.error("Error fetching onboarding status:", error);
        return false;
      }
    };

    const updateStatus = async (session: Session | null) => {
      if (!mounted) return;

      if (!session) {
        setStatus({
          session: null,
          isAuthenticated: false,
          hasCompletedOnboarding: null,
          isLoading: false,
        });
        return;
      }

      const hasCompleted = await fetchOnboardingStatus(session.user.id);

      if (mounted) {
        setStatus({
          session,
          isAuthenticated: true,
          hasCompletedOnboarding: hasCompleted,
          isLoading: false,
        });
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Use setTimeout to avoid deadlock
        setTimeout(() => {
          updateStatus(session);
        }, 0);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateStatus(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refetch = async () => {
    if (!status.session) return;
    
    setStatus(prev => ({ ...prev, isLoading: true }));
    
    const { data } = await supabase
      .from("user_settings")
      .select("has_completed_onboarding")
      .eq("user_id", status.session.user.id)
      .maybeSingle();

    setStatus(prev => ({
      ...prev,
      hasCompletedOnboarding: data?.has_completed_onboarding ?? false,
      isLoading: false,
    }));
  };

  return { ...status, refetch };
};
