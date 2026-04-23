import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right";
  action?: "click" | "complete"; // How to advance step
  completedOn?: number; // Timestamp when completed
}

interface OnboardingState {
  currentStep: number;
  completedSteps: string[];
  isActive: boolean;
  startedAt?: number;
  completedAt?: number;
}

const ONBOARDING_KEY = "myguystime_onboarding_v1";

// Define walkthrough steps
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to MyGuysTime",
    description: "Track crew hours, manage payroll, and export to accounting in one place.",
    position: "bottom",
    action: "click",
  },
  {
    id: "team-tab",
    title: "Manage Your Team",
    description: "View all crew members, their rates, and assignments. Click 'Add Employee' to onboard someone new.",
    target: ".nav__item--team",
    position: "bottom",
    action: "click",
  },
  {
    id: "add-employee",
    title: "Add a New Employee",
    description: "Set their hourly rate and assign them to a truck. They'll start appearing in the daily log.",
    target: ".team-management__add-btn",
    position: "top",
    action: "click",
  },
  {
    id: "export-payroll",
    title: "Export Payroll",
    description: "Generate a CSV with hours, overtime, and gross pay. Send directly to your accountant.",
    target: ".app-nav__export-btn",
    position: "bottom",
    action: "click",
  },
  {
    id: "missing-time-alert",
    title: "Stay on Top of Missing Hours",
    description: "The banner alerts you when crew members forget to log time. Click 'FIX NOW' to jump to their entry.",
    target: ".missing-time-alert",
    position: "bottom",
    action: "complete",
  },
  {
    id: "crew-board",
    title: "Log Daily Hours",
    description: "Add hours for each crew member each day. The system automatically calculates totals and overtime.",
    target: ".weekly-crew-board",
    position: "top",
    action: "complete",
  },
  {
    id: "done",
    title: "You're All Set!",
    description: "You can revisit this tour anytime. Have questions? Check the help menu.",
    position: "bottom",
    action: "click",
  },
];

export const useOnboarding = (shouldStart: boolean = true) => {
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      currentStep: 0,
      completedSteps: [],
      isActive: shouldStart,
      startedAt: shouldStart ? Date.now() : undefined,
    };
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  }, [state]);

  const currentStepData = ONBOARDING_STEPS[state.currentStep];

  const nextStep = useCallback(() => {
    setState((prev) => {
      const newStep = prev.currentStep + 1;
      const stepCompleted = ONBOARDING_STEPS[prev.currentStep]?.id;

      return {
        ...prev,
        currentStep: newStep,
        completedSteps: stepCompleted
          ? [...prev.completedSteps, stepCompleted]
          : prev.completedSteps,
      };
    });
  }, []);

  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  const skipTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      completedAt: Date.now(),
    }));
  }, []);

  const restartTour = useCallback(() => {
    setState({
      currentStep: 0,
      completedSteps: [],
      isActive: true,
      startedAt: Date.now(),
    });
  }, []);

  const completeStep = useCallback((stepId: string) => {
    setState((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
    }));
  }, []);

  const isComplete = state.currentStep >= ONBOARDING_STEPS.length;

  return {
    // State
    isActive: state.isActive && !isComplete,
    currentStep: state.currentStep,
    currentStepData,
    completedSteps: state.completedSteps,
    isComplete,
    progress: (state.currentStep / ONBOARDING_STEPS.length) * 100,

    // Actions
    nextStep,
    previousStep,
    skipTour,
    restartTour,
    completeStep,
  };
};

// Context for sharing onboarding state across components
export const OnboardingContext = createContext<ReturnType<typeof useOnboarding> | null>(null);

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboardingContext must be used within OnboardingProvider");
  }
  return context;
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const onboarding = useOnboarding();
  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
};
