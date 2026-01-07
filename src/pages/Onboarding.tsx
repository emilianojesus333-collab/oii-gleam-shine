import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PersonalDataStep } from "@/components/onboarding/steps/PersonalDataStep";
import { GoalStep } from "@/components/onboarding/steps/GoalStep";
import { ExperienceStep } from "@/components/onboarding/steps/ExperienceStep";
import { FocusStep } from "@/components/onboarding/steps/FocusStep";
import { CalendarStep } from "@/components/onboarding/steps/CalendarStep";
import { toast } from "sonner";

type Step = "personal" | "goal" | "experience" | "focus" | "calendar";

interface PersonalData {
  name: string;
  height: string;
  weight: string;
  gender: string;
  birthYear: string;
}

interface OnboardingData {
  personal: PersonalData;
  goal: string | null;
  experience: string | null;
  focus: string | null;
  schedule: Record<string, string[]>;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [data, setData] = useState<OnboardingData>({
    personal: {
      name: "",
      height: "170",
      weight: "",
      gender: "",
      birthYear: "",
    },
    goal: null,
    experience: null,
    focus: null,
    schedule: {},
  });

  // Check auth on mount - redirect to /auth if not logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setUserId(session.user.id);
        
        // Check if user already completed onboarding
        const { data: settings } = await supabase
          .from("user_settings")
          .select("has_completed_onboarding")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (settings?.has_completed_onboarding) {
          // Already completed onboarding, redirect to home
          navigate("/home", { replace: true });
          return;
        }
        
        setLoading(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleComplete = async () => {
    if (!userId || saving) return;
    
    setSaving(true);
    
    try {
      // Save onboarding data to user-specific localStorage for compatibility
      localStorage.setItem(`liftmate_onboarding_${userId}`, JSON.stringify(data));
      
      // Check if user_settings record exists
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      let updateError;

      if (existingSettings) {
        // Update existing record
        const { error } = await supabase
          .from("user_settings")
          .update({
            has_completed_onboarding: true,
            onboarding_data: JSON.parse(JSON.stringify(data)),
          })
          .eq("user_id", userId);
        updateError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("user_settings")
          .insert([{
            user_id: userId,
            has_completed_onboarding: true,
            onboarding_data: JSON.parse(JSON.stringify(data)),
          }]);
        updateError = error;
      }

      if (updateError) {
        console.error("Error updating onboarding status:", updateError);
        toast.error("Erro ao salvar dados. Tente novamente.");
        setSaving(false);
        return;
      }

      // Navigate to processing page
      navigate("/processing", { replace: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Erro ao salvar dados. Tente novamente.");
      setSaving(false);
    }
  };

  const stepFlow: Step[] = ["personal", "goal", "experience", "focus", "calendar"];

  const goToNextStep = () => {
    const currentIndex = stepFlow.indexOf(currentStep);
    if (currentIndex < stepFlow.length - 1) {
      setCurrentStep(stepFlow[currentIndex + 1]);
    } else {
      handleComplete();
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = stepFlow.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepFlow[currentIndex - 1]);
    }
  };

  const handleSelectGroups = (day: string, groups: string[]) => {
    setData((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: groups },
    }));
  };

  const handleUpdatePersonal = (updates: Partial<PersonalData>) => {
    setData((prev) => ({
      ...prev,
      personal: { ...prev.personal, ...updates },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {currentStep === "personal" && (
          <PersonalDataStep
            key="personal"
            personalData={data.personal}
            onUpdate={handleUpdatePersonal}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === "goal" && (
          <GoalStep
            key="goal"
            selectedGoal={data.goal}
            onSelect={(goal) => setData((prev) => ({ ...prev, goal }))}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === "experience" && (
          <ExperienceStep
            key="experience"
            selectedExperience={data.experience}
            onSelect={(experience) => setData((prev) => ({ ...prev, experience }))}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === "focus" && (
          <FocusStep
            key="focus"
            selectedFocus={data.focus}
            onSelect={(focus) => setData((prev) => ({ ...prev, focus }))}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === "calendar" && (
          <CalendarStep
            key="calendar"
            schedule={data.schedule}
            onSelectGroups={handleSelectGroups}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
