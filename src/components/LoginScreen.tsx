import { FormEvent, useState } from "react";

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error?: string;
}

export function LoginScreen({ onLogin, error }: LoginScreenProps) {
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
      <section className="login-card">
        <p className="eyebrow">Crew Timecard MVP</p>
        <h1>Sign in to the weekly crew board</h1>
        <p className="hero-copy">
          Demo accounts are seeded for Admin, Foreman, and Employee so we can verify role-based
          access against the real database.
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
        <div className="demo-logins">
          <strong>Seeded logins</strong>
          <p style={{ marginTop: "8px", fontWeight: "500" }}>Crew Time Masonry & Roofing (MA)</p>
          <span>`admin@crewtime.local / admin123`</span>
          <span>`luis@crewtime.local / foreman123`</span>
          <span>`marco@crewtime.local / employee123`</span>
          <p style={{ marginTop: "12px", marginBottom: "0", fontWeight: "500" }}>ApexRoofing, Inc (TX)</p>
          <span>`admin@apexroofing.local / apex_admin123`</span>
          <span>`jake@apexroofing.local / apex_foreman123`</span>
          <span>`sarah@apexroofing.local / apex_employee123`</span>
        </div>
      </section>
    </div>
  );
}
