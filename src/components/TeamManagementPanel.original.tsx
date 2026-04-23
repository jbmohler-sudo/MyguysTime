import { useMemo } from "react";
import type { ManagedEmployee, BootstrapPayload } from "../domain/models";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";

interface TeamManagementPanelProps {
  data: BootstrapPayload;
  onOpenAddEmployee: () => void;
  onEditEmployee: (employee: ManagedEmployee) => void;
}

export function TeamManagementPanel({
  data,
  onOpenAddEmployee,
  onEditEmployee,
}: TeamManagementPanelProps) {
  // Get active employees from the data
  // Using employeeWeeks as source since that's what's available in BootstrapPayload
  // Note: In future, this should use a dedicated ManagedEmployee[] list
  const activeEmployees = useMemo(() => {
    // Deduplicate employees (same person might appear multiple weeks)
    const seen = new Set<string>();
    const employees = [];

    for (const week of data.employeeWeeks) {
      if (!seen.has(week.employeeId)) {
        seen.add(week.employeeId);
        employees.push({
          id: week.employeeId,
          name: week.employeeName,
          crewName: week.crewName,
          hourlyRate: week.hourlyRate,
          workerType: week.workerType,
        });
      }
    }

    return employees.sort((a, b) => a.name.localeCompare(b.name));
  }, [data.employeeWeeks]);

  return (
    <div
      style={{
        padding: "32px",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <h2
          style={{
            color: BRAND_DARK,
            fontWeight: 800,
            fontSize: "1.8rem",
            margin: 0,
          }}
        >
          Crew Management
        </h2>
        <button
          onClick={onOpenAddEmployee}
          style={{
            backgroundColor: BRAND_ORANGE,
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: 800,
            fontSize: "0.875rem",
            cursor: "pointer",
            boxShadow: `0 4px 12px rgba(255, 140, 0, 0.3)`,
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(-2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              `0 6px 16px rgba(255, 140, 0, 0.4)`;
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              `0 4px 12px rgba(255, 140, 0, 0.3)`;
          }}
          type="button"
        >
          + ADD NEW GUY
        </button>
      </div>

      {/* Employee List */}
      {activeEmployees.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#999",
          }}
        >
          <p style={{ fontSize: "1rem", margin: "0 0 10px 0" }}>
            No crew members yet
          </p>
          <p style={{ fontSize: "0.875rem", margin: 0 }}>
            Click "Add New Guy" above to add your first employee
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {activeEmployees.map((worker) => (
            <div
              key={worker.id}
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                borderLeft: `4px solid ${BRAND_ORANGE}`,
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 4px 16px rgba(0,0,0,0.1)";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.05)";
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(0)";
              }}
            >
              {/* Left: Name + Avatar */}
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                {/* Avatar Initials */}
                <div
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: "50%",
                    backgroundColor: "#EEE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: BRAND_DARK,
                    fontSize: "1.1rem",
                  }}
                >
                  {worker.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + Metadata */}
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: BRAND_DARK,
                    }}
                  >
                    {worker.name}
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "#666",
                      fontWeight: 500,
                    }}
                  >
                    {worker.workerType === "contractor_1099"
                      ? "1099 Contractor"
                      : "Employee"}{" "}
                    • Crew: <strong>{worker.crewName}</strong>
                  </p>
                </div>
              </div>

              {/* Center: Hourly Rate */}
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: "#999",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Hourly Rate
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.3rem",
                    fontWeight: 800,
                    color: BRAND_DARK,
                  }}
                >
                  {worker.hourlyRate ? (
                    <>
                      <span style={{ color: BRAND_ORANGE }}>$</span>
                      {worker.hourlyRate.toFixed(2)}
                    </>
                  ) : (
                    <span style={{ color: "#CCC", fontSize: "0.9rem" }}>—</span>
                  )}
                </p>
              </div>

              {/* Right: Edit Button */}
              <button
                onClick={() =>
                  onEditEmployee({
                    id: worker.id,
                    firstName: worker.name.split(" ")[0],
                    lastName: worker.name.split(" ").slice(1).join(" "),
                    displayName: worker.name,
                    workerType: worker.workerType,
                    hourlyRate: worker.hourlyRate || 0,
                    active: true,
                    defaultCrewId: null,
                    defaultCrewName: worker.crewName,
                    hasLoginAccess: true,
                  })
                }
                style={{
                  background: "none",
                  border: "2px solid #DDD",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: BRAND_DARK,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    BRAND_ORANGE;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    BRAND_ORANGE;
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#DDD";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    BRAND_DARK;
                }}
                type="button"
              >
                Edit Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
