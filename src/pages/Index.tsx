import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useOnboardingStatus();

  useEffect(() => {
    // Wait until loading is complete
    if (isLoading) return;

    // Not authenticated -> go to auth
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }

    // Authenticated but hasn't completed onboarding -> go to onboarding
    if (!hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Authenticated and completed onboarding -> go to home
    navigate("/home", { replace: true });
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, navigate]);

  // Show loading spinner while checking status
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Index;
