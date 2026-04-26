import { FormEvent, useState } from "react";

interface SignupScreenProps {
  onSignup: (fullName: string, companyName: string, email: string, password: string) => Promise<void>;
  onShowLogin: () => void;
  error?: string;
}

export function SignupScreen({ onSignup, onShowLogin, error }: SignupScreenProps) {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    if (!fullName.trim() || !companyName.trim() || !email.trim() || !password) {
      setLocalError("Fill out each field to create your company account.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords must match.");
      return;
    }

    setSubmitting(true);

    try {
      await onSignup(fullName.trim(), companyName.trim(), email.trim(), password);
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card auth-card">
        <p className="eyebrow">New company account</p>
        <h1>Start your crew board</h1>
        <p className="hero-copy">
          Create the first admin account, then finish the existing company setup flow to open your weekly board.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              autoFocus
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              type="text"
            />
          </label>
          <label>
            Company name
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              type="text"
            />
          </label>
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
            />
          </label>
          <div className="settings-grid auth-grid">
            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm password
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </label>
          </div>
          <button className="button-strong" disabled={submitting} type="submit">
            {submitting ? "Creating account..." : "Create company account"}
          </button>
        </form>
        {localError || error ? <p className="error-banner">{localError || error}</p> : null}
        <div className="auth-switch">
          <span>Already have a login?</span>
          <button className="button-muted" onClick={onShowLogin} type="button">
            Back to sign in
          </button>
        </div>
      </section>
    </div>
  );
}
