import { Navigate } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useSubscription } from "@/hooks/useSubscription";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  requireOnboarding?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireSubscription = false,
  requireOnboarding = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useOnboardingStatus();
  
  // Only check subscription when authenticated
  const { 
    isLoading: subscriptionLoading, 
    shouldShowPaywall, 
    isSubscriptionValid,
    status: subscriptionStatus,
    isTrialing
  } = useSubscription(isAuthenticated);

  // Show loading while checking auth or onboarding status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Check if onboarding is required and not completed
  if (requireOnboarding && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // If subscription is required, check subscription status
  if (requireSubscription) {
    // Check for dev bypass
    const devBypass = localStorage.getItem("liftmate_dev_bypass") === "true";
    if (devBypass) {
      console.log("[ProtectedRoute] Dev bypass active, allowing access");
      return <>{children}</>;
    }

    // Show loading while checking subscription
    if (subscriptionLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    // Check onboarding for subscription routes (from database)
    if (!hasCompletedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }

    // CRITICAL: Use the updated shouldShowPaywall which handles trialing correctly
    // The function now checks: status, isTrialing, and only returns true for never_subscribed/expired
    const needsPaywall = shouldShowPaywall();
    const hasValidSubscription = isSubscriptionValid();
    
    console.log("[ProtectedRoute] Subscription check:", {
      status: subscriptionStatus,
      isTrialing,
      needsPaywall,
      hasValidSubscription
    });

    // Only redirect to paywall if:
    // 1. shouldShowPaywall returns true (status is never_subscribed or expired AND not trialing)
    // 2. AND subscription is not valid
    if (needsPaywall && !hasValidSubscription) {
      console.log("[ProtectedRoute] Redirecting to paywall");
      return <Navigate to="/paywall" replace />;
    }
    
    console.log("[ProtectedRoute] Access granted - subscription valid or trialing");
  }

  return <>{children}</>;
};

export default ProtectedRoute;