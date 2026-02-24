import { Navigate } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";

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
  const { isLoading: subscriptionLoading, shouldShowPaywall, isSubscriptionValid, isTrialing } = useSubscriptionContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requireOnboarding && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireSubscription) {
    if (subscriptionLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!hasCompletedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }

    if (shouldShowPaywall() && !isSubscriptionValid()) {
      return <Navigate to="/paywall" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
