import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { IdentificationStep } from "@/components/onboarding/steps/IdentificationStep";
import { PhysicalDataStep } from "@/components/onboarding/steps/PhysicalDataStep";
import { ExperienceStep } from "@/components/onboarding/steps/ExperienceStep";
import { FrequencyStep } from "@/components/onboarding/steps/FrequencyStep";
import { LocationStep } from "@/components/onboarding/steps/LocationStep";
import { GoalStep } from "@/components/onboarding/steps/GoalStep";
import { MusclePriorityStep } from "@/components/onboarding/steps/MusclePriorityStep";
import { LimitationsStep } from "@/components/onboarding/steps/LimitationsStep";
import { toast } from "sonner";

type Step = "identification" | "physical" | "experience" | "frequency" | "location" | "goal" | "muscles" | "limitations";

interface OnboardingData {
  name: string;
  birthYear: string;
  gender: string;
  height: string;
  weight: string;
  experience: string | null;
  frequency: string | null;
  location: string | null;
  goal: string | null;
  musclePriority: string[];
  limitations: string[];
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("identification");
  const [data, setData] = useState<OnboardingData>({
    name: "",
    birthYear: "",
    gender: "",
    height: "170",
    weight: "",
    experience: null,
    frequency: null,
    location: null,
    goal: null,
    musclePriority: [],
    limitations: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setUserId(session.user.id);
        const { data: settings } = await supabase
          .from("user_settings")
          .select("has_completed_onboarding")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (settings?.has_completed_onboarding) {
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
      // Convert to legacy-compatible format for localStorage
      const legacyData = {
        personal: {
          name: data.name,
          height: data.height,
          weight: data.weight,
          gender: data.gender,
          birthYear: data.birthYear,
        },
        goal: data.goal,
        experience: data.experience,
        frequency: data.frequency,
        location: data.location,
        musclePriority: data.musclePriority,
        limitations: data.limitations,
        focus: null,
        schedule: {},
      };

      localStorage.setItem(`liftmate_onboarding_${userId}`, JSON.stringify(legacyData));

      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const payload = {
        has_completed_onboarding: true,
        onboarding_data: JSON.parse(JSON.stringify(legacyData)),
      };

      let updateError;
      if (existingSettings) {
        const { error } = await supabase
          .from("user_settings")
          .update(payload)
          .eq("user_id", userId);
        updateError = error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert([{ user_id: userId, ...payload }]);
        updateError = error;
      }

      if (updateError) {
        console.error("Error updating onboarding status:", updateError);
        toast.error("Erro ao salvar dados. Tente novamente.");
        setSaving(false);
        return;
      }

      navigate("/processing", { replace: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Erro ao salvar dados. Tente novamente.");
      setSaving(false);
    }
  };

  const stepFlow: Step[] = ["identification", "physical", "experience", "frequency", "location", "goal", "muscles", "limitations"];

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

  const handleToggleMuscle = (muscle: string) => {
    setData((prev) => ({
      ...prev,
      musclePriority: prev.musclePriority.includes(muscle)
        ? prev.musclePriority.filter((m) => m !== muscle)
        : [...prev.musclePriority, muscle],
    }));
  };

  const handleToggleLimitation = (limitation: string) => {
    if (limitation === "__clear_all__") {
      setData((prev) => ({ ...prev, limitations: [] }));
      return;
    }
    setData((prev) => ({
      ...prev,
      limitations: prev.limitations.includes(limitation)
        ? prev.limitations.filter((l) => l !== limitation)
        : [...prev.limitations, limitation],
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
        {currentStep === "identification" && (
          <IdentificationStep
            key="identification"
            data={{ name: data.name, birthYear: data.birthYear, gender: data.gender }}
            onUpdate={(updates) => setData((prev) => ({ ...prev, ...updates }))}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === "physical" && (
          <PhysicalDataStep
            key="physical"
            data={{ height: data.height, weight: data.weight }}
            onUpdate={(updates) => setData((prev) => ({ ...prev, ...updates }))}
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

        {currentStep === "frequency" && (
          <FrequencyStep
            key="frequency"
            selectedFrequency={data.frequency}
            onSelect={(frequency) => setData((prev) => ({ ...prev, frequency }))}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === "location" && (
          <LocationStep
            key="location"
            selectedLocation={data.location}
            onSelect={(location) => setData((prev) => ({ ...prev, location }))}
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

        {currentStep === "muscles" && (
          <MusclePriorityStep
            key="muscles"
            selectedMuscles={data.musclePriority}
            onToggle={handleToggleMuscle}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}

        {currentStep === "limitations" && (
          <LimitationsStep
            key="limitations"
            selectedLimitations={data.limitations}
            onToggle={handleToggleLimitation}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
