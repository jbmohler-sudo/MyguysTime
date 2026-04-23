import { useState, useRef } from "react";
import type { CrewSummary, InviteInput, InviteSummary } from "../domain/models";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useAnalytics } from "../hooks/useAnalytics";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";

interface InviteEmployeeModalProps {
  isOpen: boolean;
  crews: CrewSummary[];
  onClose: () => void;
  onInviteSent: (invite: InviteSummary, inviteUrl?: string) => void;
  onCreateInvite: (payload: InviteInput) => Promise<{ invite: InviteSummary; inviteUrl?: string }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteEmployeeModal({
  isOpen,
  crews,
  onClose,
  onInviteSent,
  onCreateInvite,
}: InviteEmployeeModalProps) {
  const [email, setEmail] = useState("");
  const [selectedCrewId, setSelectedCrewId] = useState("");
  const [hourlyRate, setHourlyRate] = useState(25);
  const [role, setRole] = useState<"employee" | "foreman">("employee");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analytics = useAnalytics();

  function handleClose() {
    if (!isSaving) {
      setEmail("");
      setSelectedCrewId("");
      setHourlyRate(25);
      setRole("employee");
      setError(null);
      onClose();
    }
  }

  useFocusTrap(containerRef, isOpen, handleClose);

  if (!isOpen) return null;

  async function handleSend() {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!selectedCrewId) {
      setError("Please select a crew");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const result = await onCreateInvite({
        email: email.trim(),
        role,
        crewId: selectedCrewId,
        hourlyRate,
      });
      analytics.trackEvent("invite_created", {
        crew_name: crews.find((c) => c.id === selectedCrewId)?.name ?? "",
        hourly_rate: hourlyRate,
      });
      onInviteSent(result.invite, result.inviteUrl);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const isValid = EMAIL_RE.test(email.trim()) && Boolean(selectedCrewId);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "480px",
          padding: "28px 28px 24px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 id="invite-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: BRAND_DARK }}>
            Invite a New Worker
          </h2>
          <button
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#999", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: BRAND_DARK, marginBottom: "6px" }}>
            Email address *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="worker@example.com"
            disabled={isSaving}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1.5px solid #DDD",
              fontSize: "14px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        {/* Crew */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: BRAND_DARK, marginBottom: "6px" }}>
            Assign to crew *
          </label>
          <select
            value={selectedCrewId}
            onChange={(e) => setSelectedCrewId(e.target.value)}
            disabled={isSaving}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1.5px solid #DDD",
              fontSize: "14px",
              background: "#fff",
            }}
          >
            <option value="">Select a crew…</option>
            {crews.map((crew) => (
              <option key={crew.id} value={crew.id}>{crew.name}</option>
            ))}
          </select>
        </div>

        {/* Hourly Rate */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: BRAND_DARK, marginBottom: "6px" }}>
            Hourly rate: <span style={{ color: BRAND_ORANGE }}>${hourlyRate}/hr</span>
          </label>
          <input
            type="range"
            min={10}
            max={200}
            step={1}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            disabled={isSaving}
            style={{ width: "100%", accentColor: BRAND_ORANGE }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999", marginTop: "2px" }}>
            <span>$10</span>
            <span>$200</span>
          </div>
        </div>

        {/* Role */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: BRAND_DARK, marginBottom: "8px" }}>
            Role
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            {(["employee", "foreman"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: `2px solid ${role === r ? BRAND_ORANGE : "#DDD"}`,
                  background: role === r ? "#FFF3E0" : "#fff",
                  color: role === r ? BRAND_ORANGE : "#666",
                  fontWeight: role === r ? 700 : 400,
                  fontSize: "13px",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* SMS note */}
        <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#999" }}>
          SMS invites coming in Phase 2. Email only for now.
        </p>

        {error && (
          <p style={{ margin: "0 0 12px", padding: "10px 12px", borderRadius: "8px", background: "#FFF0F0", color: "#C62828", fontSize: "13px" }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={handleClose}
            disabled={isSaving}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1.5px solid #DDD",
              background: "#fff",
              color: "#666",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!isValid || isSaving}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background: isValid && !isSaving ? BRAND_ORANGE : "#CCC",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isValid && !isSaving ? "pointer" : "not-allowed",
            }}
          >
            {isSaving ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
