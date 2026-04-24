import { FormEvent, useState } from "react";
import { usePreviewUser } from "../context/PreviewUserContext";

interface LoginPageProps {
  error?: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onShowSignup: () => void;
}

export function LoginPage({ error, onLogin, onShowSignup }: LoginPageProps) {
  const { setPreviewRole } = usePreviewUser();
  const [email, setEmail] = useState("admin@crewtime.local");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setLocalError("");

    try {
      await onLogin(email, password);
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card auth-card">
        <p className="eyebrow">Crew Timecard MVP</p>
        <h1>Open the real crew board fast</h1>
        <p className="hero-copy">
          Use a temporary magic login for live phone testing, then fall back to the normal seeded login
          if you need the real backend session.
        </p>

        <div className="magic-login-panel">
          <strong>Magic login</strong>
          <p>Skip passwords for a few minutes and load the same shared app shell and truck cards we are tuning.</p>
          <div className="magic-login-grid">
            <button className="button-strong" onClick={() => setPreviewRole("admin")} type="button">
              Continue as Admin
            </button>
            <button className="button-strong" onClick={() => setPreviewRole("foreman")} type="button">
              Continue as Foreman
            </button>
            <button className="button-strong" onClick={() => setPreviewRole("employee")} type="button">
              Continue as Employee
            </button>
          </div>
        </div>

        <div className="login-divider">Or use seeded login</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </label>
          <button disabled={submitting} type="submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {localError || error ? <p className="error-banner">{localError || error}</p> : null}

        <div className="auth-switch">
          <span>Starting a new company?</span>
          <button className="button-muted" onClick={onShowSignup} type="button">
            Create admin account
          </button>
        </div>
      </section>
    </div>
  );
}
