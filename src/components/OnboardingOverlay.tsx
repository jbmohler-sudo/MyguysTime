import React, { useEffect, useRef } from "react";
import { useOnboardingContext } from "../hooks/useOnboarding";
import { useAnalytics } from "../hooks/useAnalytics";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1A";

export const OnboardingOverlay: React.FC = () => {
  const onboarding = useOnboardingContext();
  const analytics = useAnalytics();
  const highlightRef = useRef<HTMLDivElement>(null);

  const step = onboarding.currentStepData;
  const isActive = onboarding.isActive;

  // Track step view — must run before any early return
  useEffect(() => {
    if (!isActive || !step) return;
    analytics.trackEvent("onboarding_step_viewed", {
      step: step.id,
      stepNumber: onboarding.currentStep + 1,
      totalSteps: 7,
    });
  }, [step?.id, onboarding.currentStep, isActive]);

  // Highlight target element if specified — must run before any early return
  useEffect(() => {
    if (!isActive || !step?.target) return;

    const targetElement = document.querySelector(step.target) as HTMLElement;
    if (!targetElement || !highlightRef.current) return;

    const rect = targetElement.getBoundingClientRect();
    const overlay = highlightRef.current;

    overlay.style.left = `${rect.left - 8}px`;
    overlay.style.top = `${rect.top - 8}px`;
    overlay.style.width = `${rect.width + 16}px`;
    overlay.style.height = `${rect.height + 16}px`;
    overlay.style.display = "block";

    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step?.target, isActive]);

  if (!isActive) return null;
  if (!step) return null;

  const getTooltipPosition = (): React.CSSProperties => {
    if (!step.target) {
      // Center tooltip on screen
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const targetElement = document.querySelector(step.target) as HTMLElement;
    if (!targetElement) return {};

    const rect = targetElement.getBoundingClientRect();
    const spacing = 16;
    switch (step.position) {
      case "top":
        return {
          top: `${rect.top - spacing}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: `${rect.bottom + spacing}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - spacing}px`,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + spacing}px`,
          transform: "translateY(-50%)",
        };
      default:
        return {};
    }
  };

  const handleNext = () => {
    analytics.trackEvent("onboarding_step_completed", {
      step: step.id,
      action: "next",
    });
    onboarding.nextStep();
  };

  const handleSkip = () => {
    analytics.trackEvent("onboarding_skipped", {
      step: step.id,
      stepsCompleted: onboarding.completedSteps.length,
    });
    onboarding.skipTour();
  };

  const isLastStep = onboarding.currentStep === 6;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9998,
        }}
        onClick={handleSkip}
      />

      {/* Highlight box around target */}
      {step.target && (
        <div
          ref={highlightRef}
          style={{
            position: "fixed",
            border: `3px solid ${BRAND_ORANGE}`,
            borderRadius: "8px",
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
            pointerEvents: "none",
            zIndex: 9999,
            display: "none",
            transition: "all 300ms ease-out",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          ...getTooltipPosition(),
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          padding: "24px",
          maxWidth: "320px",
          zIndex: 10000,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Progress indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "#808080",
              fontWeight: 500,
            }}
          >
            Step {onboarding.currentStep + 1} of {7}
          </span>
          <div
            style={{
              width: "100px",
              height: "4px",
              backgroundColor: "#E0E0E0",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${onboarding.progress}%`,
                height: "100%",
                backgroundColor: BRAND_ORANGE,
                transition: "width 300ms ease-out",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "16px",
            fontWeight: 600,
            color: BRAND_DARK,
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            margin: "0 0 20px 0",
            fontSize: "14px",
            color: "#666",
            lineHeight: 1.5,
          }}
        >
          {step.description}
        </p>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={handleSkip}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #E0E0E0",
              backgroundColor: "white",
              color: BRAND_DARK,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F5F5F5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: BRAND_ORANGE,
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 140, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
};
