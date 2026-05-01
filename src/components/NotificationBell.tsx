import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import type { AppAlert } from "../domain/alerts";

interface NotificationBellProps {
  alerts: AppAlert[];
}

const KIND_LABEL: Record<AppAlert["kind"], string> = {
  missing_time: "Time",
  w4_missing: "W-4",
  threshold_1099: "1099",
};

const KIND_BADGE_CLASS: Record<AppAlert["kind"], string> = {
  missing_time: "status-badge status-badge--draft",
  w4_missing: "status-badge status-badge--confirmed",
  threshold_1099: "status-badge status-badge--reopened",
};

export function NotificationBell({ alerts }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  const count = visibleAlerts.length;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Close on click outside panel
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // delay so the bell's own click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={count > 0 ? `${count} alert${count === 1 ? "" : "s"}, open notifications` : "No alerts"}
        aria-expanded={open}
        type="button"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          flexShrink: 0,
          color: count > 0 ? "var(--color-brand-primary)" : "#aaa",
          transition: "color 0.15s ease, background 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-brand-primary-soft)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        <Bell size={20} strokeWidth={count > 0 ? 2.5 : 2} />
        {count > 0 && (
          <span
            className="badge-pulse"
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              minWidth: "16px",
              height: "16px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "var(--color-brand-primary)",
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: "var(--font-weight-bold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
              pointerEvents: "none",
              animation: "badge-pulse 2s ease-in-out infinite",
            }}
          >
            {count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 199,
            background: "transparent",
          }}
        />
      )}

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(360px, 92vw)",
          zIndex: 200,
          background: "var(--color-bg-surface)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-lg) 0 0 var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 200ms ease",
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-16) var(--space-20)",
            borderBottom: "1px solid var(--color-border-default)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontWeight: "var(--font-weight-semibold)",
              fontSize: "var(--text-md)",
              color: "var(--color-text-primary)",
            }}
          >
            What needs attention
          </span>
          {count > 0 && (
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
                background: "var(--color-bg-muted)",
                borderRadius: "var(--radius-pill)",
                padding: "2px 8px",
              }}
            >
              {count}
            </span>
          )}
        </div>

        {/* Alert list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--space-12) var(--space-16)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-8)",
          }}
        >
          {visibleAlerts.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-12)",
                paddingTop: "var(--space-48)",
                color: "var(--color-text-muted)",
              }}
            >
              <Bell size={32} strokeWidth={1.5} />
              <span style={{ fontSize: "var(--text-sm)" }}>You're all caught up</span>
            </div>
          ) : (
            visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: "var(--color-bg-subtle)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-12) var(--space-16)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-8)",
                }}
              >
                {/* Top row: kind badge + dismiss */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={KIND_BADGE_CLASS[alert.kind]}>
                    {KIND_LABEL[alert.kind]}
                  </span>
                  <button
                    onClick={() => dismiss(alert.id)}
                    aria-label="Dismiss alert"
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      padding: "2px",
                      borderRadius: "4px",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Message */}
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-primary)",
                    lineHeight: "var(--line-height-relaxed)",
                  }}
                >
                  {alert.message}
                </p>

                {/* Optional action button */}
                {alert.actionLabel && alert.onAction && (
                  <button
                    onClick={() => {
                      alert.onAction!();
                      setOpen(false);
                    }}
                    type="button"
                    style={{
                      alignSelf: "flex-start",
                      background: "var(--color-brand-primary-soft)",
                      color: "var(--color-brand-primary)",
                      border: "1px solid var(--color-brand-primary-soft)",
                      borderRadius: "var(--radius-sm)",
                      padding: "5px 12px",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-weight-semibold)",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-bg-muted)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-brand-primary-soft)"; }}
                  >
                    {alert.actionLabel}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
