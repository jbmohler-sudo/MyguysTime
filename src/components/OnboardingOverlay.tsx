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
    const TOOLTIP_W = 320;
    const TOOLTIP_H = 220; // approximate rendered height
    const PAD = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const centered: React.CSSProperties = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };

    // Always center on small screens — avoids off-screen tooltips
    if (vw < 540 || !step.target) return centered;

    const targetElement = document.querySelector(step.target) as HTMLElement;
    if (!targetElement) return centered;

    const rect = targetElement.getBoundingClientRect();
    const spacing = 16;

    const clampLeft = (raw: number) =>
      Math.max(PAD, Math.min(raw, vw - TOOLTIP_W - PAD));
    const clampTop = (raw: number) =>
      Math.max(PAD, Math.min(raw, vh - TOOLTIP_H - PAD));

    switch (step.position) {
      case "top":
        return {
          top: `${clampTop(rect.top - spacing - TOOLTIP_H)}px`,
          left: `${clampLeft(rect.left + rect.width / 2 - TOOLTIP_W / 2)}px`,
        };
      case "bottom":
        return {
          top: `${clampTop(rect.bottom + spacing)}px`,
          left: `${clampLeft(rect.left + rect.width / 2 - TOOLTIP_W / 2)}px`,
        };
      case "left":
        return {
          top: `${clampTop(rect.top + rect.height / 2 - TOOLTIP_H / 2)}px`,
          left: `${clampLeft(rect.left - spacing - TOOLTIP_W)}px`,
        };
      case "right":
        return {
          top: `${clampTop(rect.top + rect.height / 2 - TOOLTIP_H / 2)}px`,
          left: `${clampLeft(rect.right + spacing)}px`,
        };
      default:
        return centered;
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
          width: "min(320px, calc(100vw - 32px))",
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
