import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkFlow = async () => {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in -> go to auth
        navigate("/auth", { replace: true });
        return;
      }

      // Logged in, check if onboarded
      const isOnboarded = localStorage.getItem("liftmate_onboarded");
      if (!isOnboarded) {
        navigate("/onboarding", { replace: true });
        return;
      }

      // Onboarded, go to home (ProtectedRoute will handle subscription check)
      navigate("/home", { replace: true });
    };

    checkFlow();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return null;
};

export default Index;
