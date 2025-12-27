import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SplashStep } from "@/components/onboarding/steps/SplashStep";
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep";
import { GoalStep } from "@/components/onboarding/steps/GoalStep";
import { ExperienceStep } from "@/components/onboarding/steps/ExperienceStep";
import { FocusStep } from "@/components/onboarding/steps/FocusStep";
import { CalendarStep } from "@/components/onboarding/steps/CalendarStep";

type Step = "splash" | "welcome" | "goal" | "experience" | "focus" | "calendar";

interface OnboardingData {
  goal: string | null;
  experience: string | null;
  focus: string | null;
  schedule: Record<string, string>;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("splash");
  const [data, setData] = useState<OnboardingData>({
    goal: null,
    experience: null,
    focus: null,
    schedule: {},
  });

  const handleComplete = () => {
    // Save onboarding data to localStorage
    localStorage.setItem("liftmate_onboarding", JSON.stringify(data));
    localStorage.setItem("liftmate_onboarded", "true");
    navigate("/home");
  };

  const stepFlow: Step[] = ["splash", "welcome", "goal", "experience", "focus", "calendar"];

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

  const handleSelectGroup = (day: string, group: string) => {
    setData((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [day]: group },
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {currentStep === "splash" && (
          <SplashStep key="splash" onContinue={goToNextStep} />
        )}

        {currentStep === "welcome" && (
          <WelcomeStep 
            key="welcome" 
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
            onSelectGroup={handleSelectGroup}
            onContinue={goToNextStep}
            onBack={goToPreviousStep}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
