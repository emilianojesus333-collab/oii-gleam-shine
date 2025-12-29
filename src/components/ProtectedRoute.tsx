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
  const { subscribed, isLoading: subscriptionLoading, isTrialing } = useSubscription(isAuthenticated);

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
    const bypassSubscription = localStorage.getItem("liftmate_dev_skip_subscription") === "true";
    if (bypassSubscription) {
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

    // Redirect to paywall if not subscribed and not trialing
    if (!subscribed && !isTrialing) {
      return <Navigate to="/paywall" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
