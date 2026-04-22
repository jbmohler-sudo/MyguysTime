import { FormEvent, useState } from "react";
import type { AcceptInviteInput } from "../domain/models";

interface AcceptInviteScreenProps {
  inviteToken: string;
  onAcceptInvite: (payload: AcceptInviteInput) => Promise<void>;
  onShowLogin: () => void;
  error?: string;
}

export function AcceptInviteScreen({
  inviteToken,
  onAcceptInvite,
  onShowLogin,
  error,
}: AcceptInviteScreenProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError("");

    if (!password) {
      setLocalError("Enter a password to accept the invite.");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords must match.");
      return;
    }

    setSubmitting(true);

    try {
      await onAcceptInvite({
        token: inviteToken,
        password,
        fullName: fullName.trim() || undefined,
      });
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : "Unable to accept invite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card auth-card">
        <p className="eyebrow">Accept invite</p>
        <h1>Create your crew login</h1>
        <p className="hero-copy">
          Set a password and we will finish linking your login access to the company that invited you.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              autoFocus
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Optional if the invite already knows you"
              type="text"
            />
          </label>
          <div className="settings-grid auth-grid">
            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
              />
            </label>
            <label>
              Confirm password
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
              />
            </label>
          </div>
          <button className="button-strong" disabled={submitting} type="submit">
            {submitting ? "Accepting invite..." : "Accept invite"}
          </button>
        </form>
        {localError || error ? <p className="error-banner">{localError || error}</p> : null}
        <div className="auth-switch">
          <span>Already accepted it?</span>
          <button className="button-muted" onClick={onShowLogin} type="button">
            Back to sign in
          </button>
        </div>
      </section>
    </div>
  );
}
