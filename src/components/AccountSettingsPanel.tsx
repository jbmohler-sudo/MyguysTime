import { FormEvent, useEffect, useState } from "react";
import { getAuthRedirectUrl, supabase } from "../lib/supabase";
import type { Viewer } from "../domain/models";

interface AccountSettingsPanelProps {
  viewer: Viewer;
  onUpdateMe: (payload: { fullName?: string; preferredView?: "office" | "truck" }) => Promise<void>;
}

function readMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function AccountSettingsPanel({ viewer, onUpdateMe }: AccountSettingsPanelProps) {
  // ── Profile ──────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(viewer.fullName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  // Keep form in sync if parent data refreshes (e.g. after a successful save)
  useEffect(() => {
    setFullName(viewer.fullName);
  }, [viewer.fullName]);

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameError("");
    setNameSuccess("");

    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameError("Name cannot be blank.");
      return;
    }
    if (trimmed === viewer.fullName) {
      setNameError("That is already your current name.");
      return;
    }

    setNameSaving(true);
    try {
      await onUpdateMe({ fullName: trimmed });
      setNameSuccess("Name updated.");
    } catch (err) {
      setNameError(readMessage(err, "Unable to update name."));
    } finally {
      setNameSaving(false);
    }
  }

  // ── Change Password ───────────────────────────────────────────────────────
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (nextPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setPasswordError("Passwords must match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: nextPassword });
      if (error) throw error;
      setNextPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated.");
    } catch (err) {
      setPasswordError(readMessage(err, "Unable to update password."));
    } finally {
      setPasswordSaving(false);
    }
  }

  // ── Change Email ──────────────────────────────────────────────────────────
  const [currentEmail, setCurrentEmail] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const addr = data.user?.email ?? "";
      setCurrentEmail(addr);
      setEmail(addr);
      setConfirmEmail(addr);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const addr = session?.user?.email ?? "";
      setCurrentEmail(addr);
      setEmail(addr);
      setConfirmEmail(addr);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    const nextEmail = email.trim().toLowerCase();
    const confirmedEmail = confirmEmail.trim().toLowerCase();

    if (!nextEmail) {
      setEmailError("Enter the new email address you want to use.");
      return;
    }
    if (nextEmail !== confirmedEmail) {
      setEmailError("Email addresses must match.");
      return;
    }
    if (nextEmail === currentEmail.toLowerCase()) {
      setEmailError("That is already your current email.");
      return;
    }

    setEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: nextEmail },
        { emailRedirectTo: getAuthRedirectUrl("/dashboard") },
      );
      if (error) throw error;
      setEmailSuccess(
        "Confirmation links sent. Check both your old and new inbox — Supabase requires approval on both ends.",
      );
    } catch (err) {
      setEmailError(readMessage(err, "Unable to update email."));
    } finally {
      setEmailSaving(false);
    }
  }

  // ── Preferences ───────────────────────────────────────────────────────────
  const [truckMode, setTruckMode] = useState(viewer.preferredView === "truck");
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState("");

  // Keep toggle in sync if viewer prop changes
  useEffect(() => {
    setTruckMode(viewer.preferredView === "truck");
  }, [viewer.preferredView]);

  async function handleTruckModeToggle() {
    const next = !truckMode;
    setTruckMode(next);
    setPrefError("");
    setPrefSaving(true);
    try {
      await onUpdateMe({ preferredView: next ? "truck" : "office" });
    } catch (err) {
      // Roll back optimistic update
      setTruckMode(!next);
      setPrefError(readMessage(err, "Unable to save preference."));
    } finally {
      setPrefSaving(false);
    }
  }

  return (
    <section className="panel compact-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Account Settings</p>
          <h2>Manage your account</h2>
          <p className="panel-subcopy">
            Profile, security credentials, and layout preferences — all in one place.
          </p>
        </div>
      </div>

      {/* ── Profile ──────────────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Profile</p>
            <h3>Your name and login email</h3>
          </div>
        </div>

        <div className="company-summary-grid account-summary-grid" style={{ marginBottom: "1.25rem" }}>
          <div>
            <span>Login email</span>
            <strong>{currentEmail || "Loading…"}</strong>
          </div>
          <div>
            <span>Display name</span>
            <strong>{viewer.fullName}</strong>
          </div>
        </div>

        <form className="login-form settings-form" onSubmit={handleNameSubmit}>
          <label>
            Full name
            <input
              autoComplete="name"
              onChange={(event) => setFullName(event.target.value)}
              type="text"
              value={fullName}
            />
          </label>

          {nameError ? <p className="error-banner">{nameError}</p> : null}
          {nameSuccess ? <p className="workflow-banner workflow-banner--soft">{nameSuccess}</p> : null}

          <div className="adjustment-actions">
            <button className="button-strong" disabled={nameSaving} type="submit">
              {nameSaving ? "Saving…" : "Update name"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Security</p>
            <h3>Change your password</h3>
          </div>
          <span className="settings-meta">
            Uses <code>supabase.auth.updateUser()</code> to rotate your live auth password.
          </span>
        </div>

        <form className="login-form settings-form" onSubmit={handlePasswordSubmit}>
          <div className="settings-grid settings-grid--tight">
            <label>
              New password
              <input
                autoComplete="new-password"
                onChange={(event) => setNextPassword(event.target.value)}
                type="password"
                value={nextPassword}
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
          </div>

          {passwordError ? <p className="error-banner">{passwordError}</p> : null}
          {passwordSuccess ? <p className="workflow-banner workflow-banner--soft">{passwordSuccess}</p> : null}

          <div className="adjustment-actions">
            <button className="button-strong" disabled={passwordSaving} type="submit">
              {passwordSaving ? "Updating password…" : "Change password"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Change Email ──────────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Security</p>
            <h3>Change your login email</h3>
          </div>
          <span className="settings-meta">
            A confirmation link will be sent to <strong>both</strong> your old and new address.
            The change takes effect only after both are approved.
          </span>
        </div>

        <form className="login-form settings-form" onSubmit={handleEmailSubmit}>
          <div className="settings-grid settings-grid--tight">
            <label>
              New email
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label>
              Confirm new email
              <input
                autoComplete="email"
                onChange={(event) => setConfirmEmail(event.target.value)}
                type="email"
                value={confirmEmail}
              />
            </label>
          </div>

          {emailError ? <p className="error-banner">{emailError}</p> : null}
          {emailSuccess ? <p className="workflow-banner workflow-banner--soft">{emailSuccess}</p> : null}

          <div className="adjustment-actions">
            <button className="button-strong" disabled={emailSaving} type="submit">
              {emailSaving ? "Sending confirmation…" : "Change email"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Preferences ───────────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Preferences</p>
            <h3>Layout defaults</h3>
          </div>
          <span className="settings-meta">
            Saved to your account so your layout choice follows you across devices.
          </span>
        </div>

        <div className="settings-form">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.875rem 1rem",
              background: "var(--surface-raised, #f8f9fa)",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle, #e2e8f0)",
            }}
          >
            <div>
              <strong style={{ display: "block", marginBottom: "2px" }}>Default to Truck Mode</strong>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted, #6b7280)" }}>
                Opens the compact mobile-friendly view by default instead of the full office dashboard.
              </span>
            </div>

            <button
              aria-checked={truckMode}
              aria-label="Toggle Truck Mode default"
              disabled={prefSaving}
              onClick={handleTruckModeToggle}
              role="switch"
              style={{
                flexShrink: 0,
                marginLeft: "1.5rem",
                width: "52px",
                height: "28px",
                borderRadius: "14px",
                border: "none",
                cursor: prefSaving ? "not-allowed" : "pointer",
                background: truckMode ? "var(--brand-orange, #FF8C00)" : "var(--border-subtle, #cbd5e1)",
                position: "relative",
                transition: "background 0.2s",
                opacity: prefSaving ? 0.6 : 1,
              }}
              type="button"
            >
              <span
                style={{
                  position: "absolute",
                  top: "3px",
                  left: truckMode ? "27px" : "3px",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>

          {prefError ? <p className="error-banner" style={{ marginTop: "0.5rem" }}>{prefError}</p> : null}
        </div>
      </section>
    </section>
  );
}
