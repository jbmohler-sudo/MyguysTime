import React, { useMemo, useState, useCallback, useRef } from "react";
import type { BootstrapPayload } from "../domain/models";

interface EmployeeRow {
  id: string;
  name: string;
  crew: string;
  rate: number;
  status: string;
}

interface TeamManagementPanelOptimizedProps {
  data: BootstrapPayload;
  onOpenAddEmployee: () => void;
  onEditEmployee: (employeeId: string) => void;
}

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1A";
const BRAND_LIGHT = "#F5F5F5";
const STATUS_GRAY = "#808080";

// Virtualization: render only visible rows (row height = 88px)
const ROW_HEIGHT = 88;
const VISIBLE_ROWS = 6; // ~528px viewport
const BUFFER_ROWS = 2; // extra rows above/below for smooth scroll

export const TeamManagementPanelOptimized: React.FC<TeamManagementPanelOptimizedProps> = ({
  data,
  onOpenAddEmployee,
  onEditEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Deduplicate and build employee rows (memoized)
  const employees = useMemo(() => {
    const employeeMap = new Map<string, EmployeeRow>();

    data.employeeWeeks.forEach((week) => {
      if (!employeeMap.has(week.employeeId)) {
        employeeMap.set(week.employeeId, {
          id: week.employeeId,
          name: week.employeeName,
          crew: week.crewName,
          rate: week.hourlyRate ?? 0,
          status: "Active",
        });
      }
    });

    return Array.from(employeeMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [data.employeeWeeks]);

  // Filter employees (memoized, debounced via search state)
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;

    const lowerSearch = searchTerm.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(lowerSearch) ||
        emp.crew.toLowerCase().includes(lowerSearch)
    );
  }, [employees, searchTerm]);

  // Virtualization: calculate which rows are visible
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
    const endIndex = Math.min(
      filteredEmployees.length,
      startIndex + VISIBLE_ROWS + BUFFER_ROWS * 2
    );

    return { startIndex, endIndex };
  }, [scrollTop, filteredEmployees.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
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
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 600,
            color: BRAND_DARK,
          }}
        >
          Team ({filteredEmployees.length})
        </h2>
        <button
          onClick={onOpenAddEmployee}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 140, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          + Add Employee
        </button>
      </div>

      {/* Search Input */}
      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <input
          type="text"
          placeholder="Search by name or crew..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
          onFocus={(e) => {
            e.currentTarget.style.borderColor = BRAND_ORANGE;
            e.currentTarget.style.boxShadow = `0 0 0 3px rgba(255, 140, 0, 0.1)`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = BRAND_LIGHT;
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Virtual List Container */}
      {filteredEmployees.length > 0 ? (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            height: "528px", // VISIBLE_ROWS * ROW_HEIGHT
            overflowY: "auto",
            position: "relative",
            border: `1px solid ${BRAND_LIGHT}`,
            borderRadius: "6px",
          }}
        >
          {/* Spacer for invisible rows above */}
          <div
            style={{
              height: `${visibleRange.startIndex * ROW_HEIGHT}px`,
            }}
          />

          {/* Visible rows */}
          {filteredEmployees
            .slice(visibleRange.startIndex, visibleRange.endIndex)
            .map((emp, idx) => (
              <div
                key={emp.id}
                onClick={() => onEditEmployee(emp.id)}
                style={{
                  padding: "12px 16px",
                  borderLeft: `4px solid ${BRAND_ORANGE}`,
                  backgroundColor: idx % 2 === 0 ? "white" : BRAND_LIGHT,
                  borderBottom: `1px solid ${BRAND_LIGHT}`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  height: `${ROW_HEIGHT - 1}px`, // -1 for border
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255, 140, 0, 0.05)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    idx % 2 === 0 ? "white" : BRAND_LIGHT;
                  e.currentTarget.style.transform = "translateX(0)";
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
                  {emp.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>

                {/* Employee Info */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
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
                    {emp.name}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "12px",
                      color: STATUS_GRAY,
                    }}
                  >
                    {emp.crew} • ${emp.rate.toFixed(2)}/hr
                  </p>
                </div>

                {/* Status Badge */}
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    backgroundColor: emp.status === "Active" ? "#E8F5E9" : "#F5F5F5",
                    color: emp.status === "Active" ? "#2E7D32" : STATUS_GRAY,
                    fontSize: "11px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {emp.status}
                </div>
              </div>
            ))}

          {/* Spacer for invisible rows below */}
          <div
            style={{
              height: `${Math.max(
                0,
                (filteredEmployees.length - visibleRange.endIndex) * ROW_HEIGHT
              )}px`,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: STATUS_GRAY,
          }}
        >
          <p style={{ margin: 0, fontSize: "14px" }}>
            {searchTerm ? "No employees match your search" : "No employees yet"}
          </p>
        </div>
      )}
    </div>
  );
};
