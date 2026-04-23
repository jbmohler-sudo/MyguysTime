import { useCallback, useEffect, useState } from "react";
import type { InviteSummary } from "../domain/models";
import { InviteStatusBadge } from "./InviteStatusBadge";
import { useAnalytics } from "../hooks/useAnalytics";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";
const STATUS_GRAY = "#808080";

type FilterStatus = "all" | InviteSummary["status"];

interface InviteManagementPanelProps {
  onListInvites: () => Promise<InviteSummary[]>;
  onResendInvite: (inviteId: string) => Promise<void>;
  onRevokeInvite: (inviteId: string) => Promise<void>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function InviteManagementPanel({
  onListInvites,
  onResendInvite,
  onRevokeInvite,
}: InviteManagementPanelProps) {
  const [invites, setInvites] = useState<InviteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<InviteSummary | null>(null);
  const analytics = useAnalytics();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await onListInvites();
      setInvites(data);
    } catch {
      // silent — parent can show global error
    } finally {
      setLoading(false);
    }
  }, [onListInvites]);

  useEffect(() => { void load(); }, [load]);

  const filtered = filter === "all" ? invites : invites.filter((i) => i.status === filter);

  const countOf = (s: FilterStatus) =>
    s === "all" ? invites.length : invites.filter((i) => i.status === s).length;

  async function handleResend(invite: InviteSummary) {
    setPendingAction(invite.id);
    try {
      await onResendInvite(invite.id);
      analytics.trackEvent("invite_resent", { email: invite.email });
      await load();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRevoke(invite: InviteSummary) {
    setConfirmRevoke(null);
    setPendingAction(invite.id);
    try {
      await onRevokeInvite(invite.id);
      analytics.trackEvent("invite_revoked", { email: invite.email });
      await load();
    } finally {
      setPendingAction(null);
    }
  }

  const TABS: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "accepted", label: "Accepted" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <div style={{ marginTop: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 20px 0", borderBottom: "1px solid #F0F0F0" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 700, color: BRAND_DARK }}>
          Sent Invites
        </h3>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {TABS.map((tab) => {
            const count = countOf(tab.key);
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px 6px 0 0",
                  border: "none",
                  borderBottom: active ? `2px solid ${BRAND_ORANGE}` : "2px solid transparent",
                  background: active ? "#FFF3E0" : "transparent",
                  color: active ? BRAND_ORANGE : STATUS_GRAY,
                  fontWeight: active ? 700 : 400,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{
                    background: active ? BRAND_ORANGE : "#E0E0E0",
                    color: active ? "#fff" : "#666",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "32px 20px" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ height: "44px", background: "#F5F5F5", borderRadius: "6px", marginBottom: "8px", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", color: STATUS_GRAY }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            {filter === "all" ? "No invites yet." : `No ${filter} invites.`}
          </p>
          {filter === "all" && (
            <p style={{ margin: "6px 0 0", fontSize: "12px" }}>Click "Invite a Worker" to get started.</p>
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F0F0" }}>
                {["Email", "Role", "Status", "Sent", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((invite) => (
                <tr key={invite.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                  <td style={{ padding: "12px 14px", color: BRAND_DARK, fontWeight: 500, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {invite.email}
                  </td>
                  <td style={{ padding: "12px 14px", color: STATUS_GRAY, textTransform: "capitalize" }}>
                    {invite.role}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <InviteStatusBadge status={invite.status} />
                  </td>
                  <td style={{ padding: "12px 14px", color: STATUS_GRAY, whiteSpace: "nowrap" }}>
                    {formatDate(invite.createdAt)}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {invite.status === "pending" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleResend(invite)}
                          disabled={pendingAction === invite.id}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: `1px solid ${BRAND_ORANGE}`,
                            background: "#fff",
                            color: BRAND_ORANGE,
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => setConfirmRevoke(invite)}
                          disabled={pendingAction === invite.id}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid #EEE",
                            background: "#fff",
                            color: "#C62828",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoke confirmation dialog */}
      {confirmRevoke && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmRevoke(null); }}
        >
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", maxWidth: "380px", width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "17px", fontWeight: 700, color: BRAND_DARK }}>Revoke invite?</h3>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: STATUS_GRAY }}>
              {confirmRevoke.email} won't be able to accept this invite. You can send a new one anytime.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmRevoke(null)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid #DDD", background: "#fff", color: "#666", fontSize: "14px", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => handleRevoke(confirmRevoke)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#C62828", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
