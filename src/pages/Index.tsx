import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useOnboardingStatus();
  const [timedOut, setTimedOut] = useState(false);

  // Timeout: if loading takes more than 8s, show error
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setTimedOut(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
      return;
    }

    if (!hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true });
      return;
    }

    navigate("/home", { replace: true });
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, navigate]);

  if (timedOut) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground text-sm">
          Não foi possível ligar ao servidor.
        </p>
        <button
          onClick={() => { setTimedOut(false); window.location.reload(); }}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Index;
