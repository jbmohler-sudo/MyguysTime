import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface ResetPasswordPageProps {
  onComplete: (token: string) => void;
  onShowLogin: () => void;
}

export function ResetPasswordPage({ onComplete, onShowLogin }: ResetPasswordPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    // Check whether there's already an active session (e.g. user refreshed the page
    // after arriving via the recovery link).
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      setReady(Boolean(data.session));
    });

    // Also listen for the PASSWORD_RECOVERY event that Supabase fires when it
    // processes the recovery token from the URL hash on first load.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(Boolean(session));
      }
      if (event === "SIGNED_OUT") {
        setReady(false);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        throw new Error("Your reset session is missing. Please request a fresh reset link.");
      }

      onComplete(data.session.access_token);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="login-shell">
        <section className="login-card auth-card">
          <p className="eyebrow">Password reset</p>
          <h1>Open the reset link again</h1>
          <p className="hero-copy">
            This page needs an active Supabase recovery session from your email link. Request a new reset if this link expired.
          </p>
          <div className="auth-switch">
            <button className="button-muted" onClick={onShowLogin} type="button">
              Back to sign in
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <section className="login-card auth-card">
        <p className="eyebrow">Password reset</p>
        <h1>Choose a new password</h1>
        <p className="hero-copy">
          This updates the password on your live Supabase account and signs you back into the crew board.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            New password
            <input
              autoComplete="new-password"
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          <label>
            Confirm new password
            <input
              autoComplete="new-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
          </label>
          <button className="button-strong" disabled={submitting} type="submit">
            {submitting ? "Saving password..." : "Save new password"}
          </button>
        </form>

        {error ? <p className="error-banner">{error}</p> : null}
      </section>
    </div>
  );
}
