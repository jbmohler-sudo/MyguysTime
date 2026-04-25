import { useState } from "react";
import { acceptInvite } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useAnalytics } from "../hooks/useAnalytics";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";
const STATUS_GRAY = "#808080";

interface SignupAfterMagicLinkProps {
  onComplete: (token: string) => void;
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") ?? "";
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  return null;
}

function strengthLabel(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "#E0E0E0", width: "0%" };
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), pw.length >= 12, /[^a-zA-Z0-9]/.test(pw)].filter(Boolean).length;
  if (score <= 2) return { label: "Weak", color: "#E53935", width: "33%" };
  if (score <= 3) return { label: "Fair", color: BRAND_ORANGE, width: "60%" };
  return { label: "Strong", color: "#2E7D32", width: "100%" };
}

export function SignupAfterMagicLink({ onComplete }: SignupAfterMagicLinkProps) {
  const token = getTokenFromUrl();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analytics = useAnalytics();

  const strength = strengthLabel(password);

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "#F8F9FB" }}>
        <div style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>
          <p style={{ fontSize: "16px", color: "#C62828" }}>
            This invite link is missing or invalid. Ask your admin to send a new one.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    analytics.trackEvent("signup_started", {});
    try {
      const result = await acceptInvite({ token, password, fullName: fullName.trim() });
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: result.email,
        password,
      });

      if (signInError || !signInData.session?.access_token) {
        throw signInError ?? new Error("Supabase session was not created after accepting the invite.");
      }

      analytics.trackEvent("signup_completed", {});
      onComplete(signInData.session.access_token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed. Please try again.";
      if (msg.toLowerCase().includes("expired")) {
        setError("This invite has expired. Ask your admin to resend it.");
      } else if (msg.toLowerCase().includes("already")) {
        setError("An account with this email already exists. Try logging in instead.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "#F8F9FB" }}>
      <div style={{ maxWidth: "440px", width: "100%", background: "#fff", borderRadius: "20px", boxShadow: "0 8px 40px rgba(0,0,0,0.10)", padding: "40px 36px" }}>
        {/* Logo / brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: BRAND_ORANGE,
            marginBottom: "14px",
          }}>
            <span style={{ fontSize: "26px" }}>⏱</span>
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 800, color: BRAND_DARK }}>
            Welcome to My Guys Time
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: STATUS_GRAY }}>
            Set your password to start tracking hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Full name */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: BRAND_DARK, marginBottom: "6px" }}>
              Your full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              disabled={submitting}
              autoComplete="name"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #DDD", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: BRAND_DARK, marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={submitting}
              autoComplete="new-password"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #DDD", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          {/* Strength meter */}
          {password.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ height: "4px", background: "#EEE", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: strength.width, background: strength.color, transition: "width 0.3s, background 0.3s" }} />
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: strength.color, fontWeight: 600 }}>
                {strength.label}
              </p>
            </div>
          )}

          {/* Confirm password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: BRAND_DARK, marginBottom: "6px" }}>
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              disabled={submitting}
              autoComplete="new-password"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: `1.5px solid ${confirmPassword && confirmPassword !== password ? "#E53935" : "#DDD"}`,
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#E53935" }}>Passwords don't match</p>
            )}
          </div>

          {error && (
            <div style={{ marginBottom: "16px", padding: "10px 12px", borderRadius: "8px", background: "#FFF0F0", color: "#C62828", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              border: "none",
              background: submitting ? "#CCC" : BRAND_ORANGE,
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Setting up your account…" : "Set Password & Start Tracking"}
          </button>
        </form>

        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "#AAA" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: BRAND_ORANGE, textDecoration: "none", fontWeight: 600 }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
