import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabase";

interface LoginPageProps {
  onSuccess: () => void;
  onShowForgotPassword: () => void;
  onShowSignup: () => void;
}

export function LoginPage({ onSuccess, onShowForgotPassword, onShowSignup }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    onSuccess();
  }

  return (
    <div className="login-shell">
      <section className="login-card auth-card">
        <p className="eyebrow">Crew Timecard</p>
        <h1>Sign In</h1>
        <p className="hero-copy">
          Welcome back. Please sign in with your company credentials.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          <button disabled={submitting} type="submit">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {error ? <p className="error-banner">{error}</p> : null}

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
