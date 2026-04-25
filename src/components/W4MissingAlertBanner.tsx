import { useMemo } from "react";
import type { CompanySettingsSummary, EmployeeWeek } from "../domain/models";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";

interface W4MissingAlertBannerProps {
  companySettings: CompanySettingsSummary | null;
  employeeWeeks: EmployeeWeek[];
}

export function W4MissingAlertBanner({ companySettings, employeeWeeks }: W4MissingAlertBannerProps) {
  const missingCount = useMemo(() => {
    return new Set(
      employeeWeeks.filter((week) => week.w4CollectedAt === null).map((week) => week.employeeId),
    ).size;
  }, [employeeWeeks]);

  if (!companySettings || companySettings.payrollMethod === "service" || missingCount === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 140, 0, 0.1)",
        borderLeft: `4px solid ${BRAND_ORANGE}`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
        borderRadius: "4px",
      }}
    >
      <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>🔔</span>
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
          Payroll Alert
        </p>
        <p style={{ margin: "2px 0 0", color: BRAND_DARK, fontSize: "0.85rem", fontWeight: 500 }}>
          W-4 info missing for {missingCount} {missingCount === 1 ? "worker" : "workers"} — estimates may be off.
        </p>
      </div>
    </div>
  );
}
