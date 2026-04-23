import { useMemo, useRef, useState } from "react";
import type { EmployeeWeek } from "../domain/models";
import { useToast } from "../hooks/useToast";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";

interface MissingTimeAlertBannerProps {
  employeeWeeks: EmployeeWeek[];
  onQuickFix?: () => void;
  onSendReminders?: (employeeIds: string[]) => Promise<{ count: number; sent: boolean }>;
}

export function MissingTimeAlertBanner({
  employeeWeeks,
  onQuickFix,
  onSendReminders,
}: MissingTimeAlertBannerProps) {
  const alertRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);

  const employeesWithMissingTime = useMemo(() => {
    return employeeWeeks.filter((week) => {
      return week.entries.some((day) => {
        const isWorkday = day.dayIndex < 5;
        const hasMissingTime = (day.totalHours || 0) === 0;
        return isWorkday && hasMissingTime;
      });
    });
  }, [employeeWeeks]);

  const missingTimeCount = employeesWithMissingTime.length;

  if (missingTimeCount === 0) {
    return null;
  }

  const handleQuickFix = () => {
    alertRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (onQuickFix) {
      setTimeout(onQuickFix, 300);
    }
  };

  const handleSendReminders = async () => {
    if (!onSendReminders) return;
    setSending(true);
    try {
      const ids = employeesWithMissingTime.map((w) => w.employeeId);
      const { count } = await onSendReminders(ids);
      showToast(
        "Reminders Sent!",
        "success",
        `Sent SMS pings to ${count} ${count === 1 ? "employee" : "employees"} with missing hours.`,
      );
    } catch {
      showToast("Failed to Send Reminders", "error", "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      ref={alertRef}
      className="missing-time-alert"
      style={{
        backgroundColor: "rgba(255, 140, 0, 0.1)",
        borderLeft: `4px solid ${BRAND_ORANGE}`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        marginBottom: "20px",
        borderRadius: "4px",
      }}
    >
      {/* Left: Icon + Message */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            fontSize: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⚠️
        </span>

        <div>
          <p
            style={{
              margin: 0,
              color: BRAND_ORANGE,
              fontWeight: 800,
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            ACTION REQUIRED
          </p>
          <p
            style={{
              margin: "2px 0 0 0",
              color: BRAND_DARK,
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            {missingTimeCount} {missingTimeCount === 1 ? "employee" : "employees"}{" "}
            {missingTimeCount === 1 ? "has" : "have"} missing hours on workdays
          </p>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        {onSendReminders && (
          <button
            onClick={() => void handleSendReminders()}
            disabled={sending}
            style={{
              backgroundColor: "white",
              color: BRAND_ORANGE,
              border: `2px solid ${BRAND_ORANGE}`,
              padding: "8px 14px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.75rem",
              cursor: sending ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              opacity: sending ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              if (!sending) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,140,0,0.08)";
              }
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "white";
            }}
            type="button"
          >
            {sending ? "Sending..." : "📱 Send SMS Reminders"}
          </button>
        )}

        <button
          onClick={handleQuickFix}
          style={{
            backgroundColor: BRAND_ORANGE,
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontWeight: 700,
            fontSize: "0.75rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s ease",
            boxShadow: `0 2px 8px rgba(255, 140, 0, 0.2)`,
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 12px rgba(255, 140, 0, 0.4)`;
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 8px rgba(255, 140, 0, 0.2)`;
          }}
          type="button"
        >
          FIX NOW
        </button>
      </div>
    </div>
  );
}
