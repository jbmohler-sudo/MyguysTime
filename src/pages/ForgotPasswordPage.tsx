import { FormEvent, useState } from "react";
import { getAuthRedirectUrl, supabase } from "../lib/supabase";

interface ForgotPasswordPageProps {
  onShowLogin: () => void;
}

export function ForgotPasswordPage({ onShowLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Enter the email address tied to your account.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: getAuthRedirectUrl("/reset-password"),
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess("Check your email for the reset link. It will bring you back here to choose a new password.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card auth-card">
        <p className="eyebrow">Password reset</p>
        <h1>Send a reset link</h1>
        <p className="hero-copy">
          Enter your account email and we will send you a secure link to choose a new password.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoFocus
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <button className="button-strong" disabled={submitting} type="submit">
            {submitting ? "Sending link..." : "Email reset link"}
          </button>
        </form>

        {error ? <p className="error-banner">{error}</p> : null}
        {success ? <p className="workflow-banner workflow-banner--soft">{success}</p> : null}

        <div className="auth-switch">
          <span>Remembered your password?</span>
          <button className="button-muted" onClick={onShowLogin} type="button">
            Back to sign in
          </button>
        </div>
      </section>
    </div>
  );
}
