import { FormEvent, useState } from "react";

interface CreateAccountScreenProps {
  onRegister: (fullName: string, email: string, password: string, companyName: string) => Promise<void>;
  onBack: () => void;
}

export function CreateAccountScreen({ onRegister, onBack }: CreateAccountScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    setSubmitting(true);

    try {
      await onRegister(fullName, email, password, companyName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Crew Timecard MVP</p>
        <h1>Create your account</h1>
        <p className="hero-copy">
          Set up your company's crew timecard account. You'll finish onboarding after signing in.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              type="text"
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
            />
          </label>
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
          <label>
            Company name
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              type="text"
              autoComplete="organization"
            />
          </label>
          <button disabled={submitting} type="submit">
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        {error ? <p className="error-banner">{error}</p> : null}
        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" className="link-btn" onClick={onBack}>
            Sign in
          </button>
        </p>
      </section>
    </div>
  );
}
