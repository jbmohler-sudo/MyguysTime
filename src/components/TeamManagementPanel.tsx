import { useMemo, useState, useCallback, useRef } from "react";
import type { BootstrapPayload, InviteSummary } from "../domain/models";
import { InviteStatusBadge } from "./InviteStatusBadge";

interface EmployeeRow {
  id: string;
  name: string;
  crew: string;
  rate: number;
}

interface TeamManagementPanelProps {
  data: BootstrapPayload;
  onOpenAddEmployee: () => void;
  onEditEmployee: (employeeId: string) => void;
  onRemoveEmployee: (employeeId: string) => Promise<void>;
  invites?: InviteSummary[];
}

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1A";
const BRAND_LIGHT = "#F5F5F5";
const STATUS_GRAY = "#808080";

const ROW_HEIGHT = 88;
const VISIBLE_ROWS = 6;
const BUFFER_ROWS = 2;

export function TeamManagementPanel({
  data,
  onOpenAddEmployee,
  onEditEmployee,
  onRemoveEmployee,
  invites = [],
}: TeamManagementPanelProps) {
  const archivedEmployeeIds = useMemo(
    () => new Set(data.archivedEmployees.map((employee) => employee.id)),
    [data.archivedEmployees],
  );
  const pendingInviteByEmployeeId = useMemo(() => {
    const map = new Map<string, InviteSummary>();
    for (const inv of invites) {
      if (inv.employeeId && inv.status === "pending") {
        map.set(inv.employeeId, inv);
      }
    }
    return map;
  }, [invites]);
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [employeePendingRemoval, setEmployeePendingRemoval] = useState<EmployeeRow | null>(null);
  const [removingEmployeeId, setRemovingEmployeeId] = useState<string | null>(null);
  const [removeMessage, setRemoveMessage] = useState<string>("");
  const [removeError, setRemoveError] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Deduplicate employees from weekly data — memoized
  const employees = useMemo<EmployeeRow[]>(() => {
    const seen = new Map<string, EmployeeRow>();
    for (const week of data.employeeWeeks) {
      if (!archivedEmployeeIds.has(week.employeeId) && !seen.has(week.employeeId)) {
        seen.set(week.employeeId, {
          id: week.employeeId,
          name: week.employeeName,
          crew: week.crewName,
          rate: week.hourlyRate ?? 0,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [archivedEmployeeIds, data.employeeWeeks]);

  // Filter by search — memoized
  const filteredEmployees = useMemo<EmployeeRow[]>(() => {
    if (!searchTerm.trim()) return employees;
    const q = searchTerm.toLowerCase();
    return employees.filter(
      (emp) => emp.name.toLowerCase().includes(q) || emp.crew.toLowerCase().includes(q),
    );
  }, [employees, searchTerm]);

  // Virtualization: which slice of rows is visible
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
    const endIndex = Math.min(
      filteredEmployees.length,
      startIndex + VISIBLE_ROWS + BUFFER_ROWS * 2,
    );
    return { startIndex, endIndex };
  }, [scrollTop, filteredEmployees.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  async function handleConfirmRemove() {
    if (!employeePendingRemoval) {
      return;
    }

    setRemoveError("");
    setRemoveMessage("");
    setRemovingEmployeeId(employeePendingRemoval.id);

    try {
      await onRemoveEmployee(employeePendingRemoval.id);
      setRemoveMessage(`${employeePendingRemoval.name} was removed from the active team.`);
      setEmployeePendingRemoval(null);
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : "Unable to remove this worker.");
    } finally {
      setRemovingEmployeeId(null);
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: BRAND_DARK }}>
          Team ({filteredEmployees.length})
        </h2>
        <button
          className="team-management__add-btn"
          onClick={onOpenAddEmployee}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(255,140,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            backgroundColor: BRAND_ORANGE,
            color: "white",
            border: "none",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          type="button"
        >
          + ADD NEW GUY
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by name or crew..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = BRAND_ORANGE;
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,140,0,0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = BRAND_LIGHT;
            e.currentTarget.style.boxShadow = "none";
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "6px",
            border: `1px solid ${BRAND_LIGHT}`,
            fontSize: "13px",
            outline: "none",
            transition: "all 0.2s ease",
            boxSizing: "border-box",
          }}
        />
      </div>

      {removeMessage ? (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "6px",
            backgroundColor: "#E8F5E9",
            color: "#2E7D32",
            fontSize: "13px",
          }}
        >
          {removeMessage}
        </div>
      ) : null}

      {removeError ? (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "6px",
            backgroundColor: "#FDECEC",
            color: "#B42318",
            fontSize: "13px",
          }}
        >
          {removeError}
        </div>
      ) : null}

      {/* Virtual list */}
      {filteredEmployees.length > 0 ? (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            height: `${VISIBLE_ROWS * ROW_HEIGHT}px`,
            overflowY: "auto",
            position: "relative",
            border: `1px solid ${BRAND_LIGHT}`,
            borderRadius: "6px",
          }}
        >
          {/* Top spacer */}
          <div style={{ height: `${visibleRange.startIndex * ROW_HEIGHT}px` }} />

          {filteredEmployees.slice(visibleRange.startIndex, visibleRange.endIndex).map((emp, idx) => {
            const actualIdx = visibleRange.startIndex + idx;
            const initials = emp.name
              .split(" ")
              .map((n) => n[0] ?? "")
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <div
                key={emp.id}
                onClick={() => onEditEmployee(emp.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,140,0,0.05)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = actualIdx % 2 === 0 ? "white" : BRAND_LIGHT;
                  e.currentTarget.style.transform = "translateX(0)";
                }}
                style={{
                  padding: "12px 16px",
                  borderLeft: `4px solid ${BRAND_ORANGE}`,
                  backgroundColor: actualIdx % 2 === 0 ? "white" : BRAND_LIGHT,
                  borderBottom: `1px solid ${BRAND_LIGHT}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  height: `${ROW_HEIGHT - 1}px`,
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  boxSizing: "border-box",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: BRAND_ORANGE,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>

                {/* Name + crew */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 600,
                      color: BRAND_DARK,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {emp.name}
                      {pendingInviteByEmployeeId.has(emp.id) && (
                        <InviteStatusBadge status="pending" size="sm" />
                      )}
                    </span>
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: STATUS_GRAY }}>
                    {emp.crew} •{" "}
                    {emp.rate > 0 ? (
                      <>
                        <span style={{ color: BRAND_ORANGE }}>$</span>
                        {emp.rate.toFixed(2)}/hr
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setRemoveError("");
                    setRemoveMessage("");
                    setEmployeePendingRemoval(emp);
                  }}
                  disabled={removingEmployeeId === emp.id}
                  style={{
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid #F2B8B5",
                    backgroundColor: "#FFF5F5",
                    color: "#B42318",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: removingEmployeeId === emp.id ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                  type="button"
                >
                  Remove
                </button>

                {/* Chevron hint */}
                <span style={{ color: "#CCC", fontSize: "16px", flexShrink: 0 }}>{">"}</span>
              </div>
            );
          })}

          {/* Bottom spacer */}
          <div
            style={{
              height: `${Math.max(0, (filteredEmployees.length - visibleRange.endIndex) * ROW_HEIGHT)}px`,
            }}
          />
        </div>
      ) : (
        <div style={{ padding: "40px 20px", textAlign: "center", color: STATUS_GRAY }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            {searchTerm ? "No employees match your search" : "No employees yet"}
          </p>
          {!searchTerm ? (
            <p style={{ margin: "8px 0 0", fontSize: "12px" }}>
              Click "+ ADD NEW GUY" to add your first employee
            </p>
          ) : null}
        </div>
      )}

      {employeePendingRemoval ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-worker-title"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.42)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
              padding: "20px",
            }}
          >
            <h3
              id="remove-worker-title"
              style={{ margin: "0 0 8px", color: BRAND_DARK, fontSize: "18px" }}
            >
              Remove from active team?
            </h3>
            <p style={{ margin: "0 0 12px", color: "#555", fontSize: "14px", lineHeight: 1.5 }}>
              {employeePendingRemoval.name} will be removed from the active team list.
            </p>
            <ul style={{ margin: "0 0 18px", paddingLeft: "18px", color: "#555", fontSize: "13px", lineHeight: 1.5 }}>
              <li>Historical timesheets and payroll records stay intact.</li>
              <li>Login access may be disabled if they have a linked User account.</li>
              <li>Pending invites for this worker will be revoked.</li>
            </ul>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setEmployeePendingRemoval(null)}
                disabled={removingEmployeeId === employeePendingRemoval.id}
                style={{
                  padding: "9px 14px",
                  borderRadius: "6px",
                  border: `1px solid ${BRAND_LIGHT}`,
                  backgroundColor: "white",
                  color: BRAND_DARK,
                  fontWeight: 700,
                  cursor: removingEmployeeId === employeePendingRemoval.id ? "not-allowed" : "pointer",
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmRemove()}
                disabled={removingEmployeeId === employeePendingRemoval.id}
                style={{
                  padding: "9px 14px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#B42318",
                  color: "white",
                  fontWeight: 700,
                  cursor: removingEmployeeId === employeePendingRemoval.id ? "not-allowed" : "pointer",
                }}
                type="button"
              >
                {removingEmployeeId === employeePendingRemoval.id ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
