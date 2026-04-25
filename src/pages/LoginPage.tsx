import { FormEvent, useState } from "react";


interface LoginPageProps {
  error?: string;
  onLogin: (email: string, password: string) => Promise<void>;
  onShowForgotPassword: () => void;
  onShowSignup: () => void;
}

export function LoginPage({ error, onLogin, onShowForgotPassword, onShowSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        <h1>Sign In</h1>
        <p className="hero-copy">
          Welcome back.
        </p>

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

        <div className="auth-switch">
          <span>Need to reset your password?</span>
          <button className="button-muted" onClick={onShowForgotPassword} type="button">
            Forgot password
          </button>
        </div>
      </section>
    </div>
  );
}
