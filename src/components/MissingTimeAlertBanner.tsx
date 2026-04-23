import { useMemo, useRef } from "react";
import type { EmployeeWeek } from "../domain/models";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";

interface MissingTimeAlertBannerProps {
  employeeWeeks: EmployeeWeek[];
  onQuickFix?: () => void;
}

export function MissingTimeAlertBanner({
  employeeWeeks,
  onQuickFix,
}: MissingTimeAlertBannerProps) {
  const alertRef = useRef<HTMLDivElement>(null);

  // Calculate employees with missing time on workdays (Mon-Fri with 0 hours)
  const employeesWithMissingTime = useMemo(() => {
    return employeeWeeks.filter((week) => {
      // Check if any workday (dayIndex 0-4 = Mon-Fri) has 0 hours
      return week.entries.some((day) => {
        const isWorkday = day.dayIndex < 5; // Mon-Fri
        const hasMissingTime = (day.totalHours || 0) === 0;
        return isWorkday && hasMissingTime;
      });
    });
  }, [employeeWeeks]);

  const missingTimeCount = employeesWithMissingTime.length;

  // Don't show if no missing time
  if (missingTimeCount === 0) {
    return null;
  }

  const handleQuickFix = () => {
    // Scroll to alert first for visibility
    alertRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // Call optional handler (e.g., scroll to crew board, highlight first incomplete)
    if (onQuickFix) {
      setTimeout(onQuickFix, 300);
    }
  };

  return (
    <div
      ref={alertRef}
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

      {/* Right: Quick Fix Button */}
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
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateY(-2px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            `0 4px 12px rgba(255, 140, 0, 0.4)`;
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            `0 2px 8px rgba(255, 140, 0, 0.2)`;
        }}
        type="button"
      >
        FIX NOW
      </button>
    </div>
  );
}
