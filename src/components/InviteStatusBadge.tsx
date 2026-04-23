import type { InviteSummary } from "../domain/models";

interface InviteStatusBadgeProps {
  status: InviteSummary["status"];
  size?: "sm" | "md";
}

const CONFIGS = {
  pending: {
    label: "Invite Sent",
    bg: "#FFF3E0",
    color: "#E65100",
    border: "2px solid #FF8C00",
    borderStyle: "solid" as const,
  },
  accepted: {
    label: "Active",
    bg: "#E8F5E9",
    color: "#2E7D32",
    border: "2px solid #4CAF50",
    borderStyle: "solid" as const,
  },
  expired: {
    label: "Invite Expired",
    bg: "#F5F5F5",
    color: "#757575",
    border: "2px dashed #9E9E9E",
    borderStyle: "dashed" as const,
  },
};

export function InviteStatusBadge({ status, size = "sm" }: InviteStatusBadgeProps) {
  const cfg = CONFIGS[status];
  if (!cfg) return null;

  const padding = size === "sm" ? "2px 8px" : "4px 10px";
  const fontSize = size === "sm" ? "11px" : "12px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: "999px",
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}
