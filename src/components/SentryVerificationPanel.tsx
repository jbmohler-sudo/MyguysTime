import { useState } from "react";
import * as Sentry from "@sentry/react";
import { triggerBackendSentryVerification } from "../lib/api";

interface SentryVerificationPanelProps {
  token: string;
  frontendEnabled: boolean;
  frontendVerificationEnabled: boolean;
  backendVerificationEnabled: boolean;
}

type VerificationState = {
  tone: "idle" | "success" | "error";
  message: string;
};

export function SentryVerificationPanel({
  token,
  frontendEnabled,
  frontendVerificationEnabled,
  backendVerificationEnabled,
}: SentryVerificationPanelProps) {
  const [frontendState, setFrontendState] = useState<VerificationState>({
    tone: "idle",
    message: "Temporary verification only. Disable the verification flags after the test event appears in Sentry.",
  });
  const [backendState, setBackendState] = useState<VerificationState>({
    tone: "idle",
    message: "Backend verification sends one manual test exception and returns the Sentry event id when available.",
  });
  const [sendingFrontend, setSendingFrontend] = useState(false);
  const [sendingBackend, setSendingBackend] = useState(false);

  if (!frontendVerificationEnabled && !backendVerificationEnabled) {
    return null;
  }

  async function sendFrontendVerification() {
    setSendingFrontend(true);

    try {
      if (!frontendEnabled) {
        setFrontendState({
          tone: "error",
          message: "Set VITE_SENTRY_DSN before using the frontend verification action.",
        });
        return;
      }

      const eventId = Sentry.captureException(
        new Error("Temporary Sentry frontend verification event. Disable after rollout verification."),
      );

      setFrontendState({
        tone: "success",
        message: eventId
          ? `Frontend test event queued with id ${eventId}. Confirm it appears in Sentry, then turn the verification flag back off.`
          : "Frontend test event was queued. Confirm it appears in Sentry, then turn the verification flag back off.",
      });
    } finally {
      setSendingFrontend(false);
    }
  }

  async function sendBackendVerification() {
    setSendingBackend(true);

    try {
      const response = await triggerBackendSentryVerification(token);
      setBackendState({
        tone: "success",
        message: response.eventId
          ? `Backend test event sent with id ${response.eventId}. Confirm it appears in Sentry, then turn the verification flag back off.`
          : "Backend test event was sent. Confirm it appears in Sentry, then turn the verification flag back off.",
      });
    } catch (error) {
      setBackendState({
        tone: "error",
        message: error instanceof Error ? error.message : "Backend Sentry verification failed.",
      });
    } finally {
      setSendingBackend(false);
    }
  }

  return (
    <section className="workflow-banner workflow-banner--soft sentry-verification-panel">
      <div className="sentry-verification-panel__header">
        <div>
          <strong>Sentry verification</strong>
          <span>Temporary rollout checks for the office/admin view only.</span>
        </div>
        <span className="alert-chip alert-chip--revision">Temporary verification only</span>
      </div>

      <div className="sentry-verification-panel__actions">
        {frontendVerificationEnabled ? (
          <div className="sentry-verification-card">
            <strong>Frontend test event</strong>
            <span>{frontendState.message}</span>
            <button
              className="button-strong"
              disabled={sendingFrontend}
              onClick={() => void sendFrontendVerification()}
              type="button"
            >
              {sendingFrontend ? "Sending frontend event..." : "Send frontend test event"}
            </button>
          </div>
        ) : null}

        {backendVerificationEnabled ? (
          <div className="sentry-verification-card">
            <strong>Backend test event</strong>
            <span>{backendState.message}</span>
            <button
              className="button-strong"
              disabled={sendingBackend}
              onClick={() => void sendBackendVerification()}
              type="button"
            >
              {sendingBackend ? "Sending backend event..." : "Send backend test event"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
