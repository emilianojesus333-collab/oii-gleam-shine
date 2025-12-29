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
    status: subscriptionStatus 
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

    // CRITICAL: Only show paywall if subscription status is "never_subscribed" or "expired"
    // Users with "active" or "canceled_but_active" status should NEVER see the paywall
    if (shouldShowPaywall()) {
      // Double-check: verify subscription is not valid by date
      if (!isSubscriptionValid()) {
        return <Navigate to="/paywall" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;