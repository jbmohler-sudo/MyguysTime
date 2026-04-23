import React, { useMemo, useRef, useState } from "react";
import type { BootstrapPayload } from "../domain/models";
import { useFocusTrap } from "../hooks/useFocusTrap";

interface ExportRow {
  employeeName: string;
  weeklyTotalHours: number;
  overtimeHours: number;
  regularHours: number;
  grossPay: number;
  status: string;
}

interface PayrollExportModalProps {
  isOpen: boolean;
  data: BootstrapPayload;
  selectedWeekRange?: { startDate: string; endDate: string };
  onClose: () => void;
  onExport: (csvContent: string, fileName: string) => void;
}

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1A";
const BRAND_LIGHT = "#F5F5F5";
const STATUS_GRAY = "#808080";

export const PayrollExportModal: React.FC<PayrollExportModalProps> = ({
  isOpen,
  data,
  selectedWeekRange,
  onClose,
  onExport,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(containerRef, isOpen, onClose);

  // Generate export rows from employee weeks data
  const exportData = useMemo(() => {
    const employeeMap = new Map<string, ExportRow>();

    data.employeeWeeks.forEach((week) => {
      const totalHours = week.entries.reduce((sum, day) => sum + (day.totalHours || 0), 0);
      const overtimeHours = Math.max(0, totalHours - 40);
      const regularHours = Math.min(40, totalHours);
      const hourlyRate = week.hourlyRate || 20;
      const grossPay = regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5;

      const key = week.employeeId;
      if (employeeMap.has(key)) {
        const existing = employeeMap.get(key)!;
        existing.weeklyTotalHours += totalHours;
        existing.overtimeHours += overtimeHours;
        existing.regularHours += regularHours;
        existing.grossPay += grossPay;
      } else {
        employeeMap.set(key, {
          employeeName: week.employeeName,
          weeklyTotalHours: totalHours,
          overtimeHours: overtimeHours,
          regularHours: regularHours,
          grossPay: grossPay,
          status: "Active",
        });
      }
    });

    return Array.from(employeeMap.values()).sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName)
    );
  }, [data.employeeWeeks]);

  // Generate CSV content
  const generateCSV = (): { csvContent: string; fileName: string } => {
    const headers = [
      "Employee Name",
      "Regular Hours",
      "Overtime Hours",
      "Total Hours",
      "Gross Pay",
      "Status",
    ];

    const rows = exportData.map((row) => [
      `"${row.employeeName}"`,
      row.regularHours.toFixed(2),
      row.overtimeHours.toFixed(2),
      row.weeklyTotalHours.toFixed(2),
      `$${row.grossPay.toFixed(2)}`,
      row.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const today = new Date().toISOString().split("T")[0];
    const fileName = `payroll-export-${today}.csv`;

    return { csvContent, fileName };
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { csvContent, fileName } = generateCSV();
      // Simulate async operation (future: actual file download/API call)
      await new Promise((resolve) => setTimeout(resolve, 500));
      onExport(csvContent, fileName);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const { fileName } = generateCSV();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-export-title"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          maxWidth: "700px",
          width: "90vw",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: `1px solid ${BRAND_LIGHT}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            id="payroll-export-title"
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 600,
              color: BRAND_DARK,
            }}
          >
            Export Payroll
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close export dialog"
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: STATUS_GRAY,
              padding: 0,
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {/* Info Box */}
          <div
            style={{
              backgroundColor: "rgba(255, 140, 0, 0.05)",
              border: `1px solid rgba(255, 140, 0, 0.2)`,
              borderRadius: "6px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: BRAND_DARK,
                lineHeight: 1.5,
              }}
            >
              <strong>Ready to export {exportData.length} employee records</strong>
              <br />
              {selectedWeekRange
                ? `Period: ${selectedWeekRange.startDate} to ${selectedWeekRange.endDate}`
                : "All available data will be included."}
            </p>
          </div>

          {/* Preview Table */}
          <div
            style={{
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: 600,
                color: BRAND_DARK,
              }}
            >
              Preview
            </h3>
            <div
              style={{
                overflowX: "auto",
                border: `1px solid ${BRAND_LIGHT}`,
                borderRadius: "6px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: BRAND_LIGHT,
                      borderBottom: `2px solid ${BRAND_ORANGE}`,
                    }}
                  >
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: BRAND_DARK,
                      }}
                    >
                      Employee
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: BRAND_DARK,
                      }}
                    >
                      Reg Hrs
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: BRAND_DARK,
                      }}
                    >
                      OT Hrs
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: BRAND_DARK,
                      }}
                    >
                      Total Hrs
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: BRAND_DARK,
                      }}
                    >
                      Gross Pay
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exportData.slice(0, 10).map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: `1px solid ${BRAND_LIGHT}`,
                        backgroundColor: idx % 2 === 0 ? "white" : BRAND_LIGHT,
                      }}
                    >
                      <td
                        style={{
                          padding: "10px",
                          color: BRAND_DARK,
                        }}
                      >
                        {row.employeeName}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          color: BRAND_DARK,
                        }}
                      >
                        {row.regularHours.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          color: BRAND_DARK,
                        }}
                      >
                        {row.overtimeHours.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          color: BRAND_DARK,
                        }}
                      >
                        {row.weeklyTotalHours.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "right",
                          color: BRAND_DARK,
                          fontWeight: 600,
                        }}
                      >
                        ${row.grossPay.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {exportData.length > 10 && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: STATUS_GRAY,
                }}
              >
                Showing 10 of {exportData.length} employees
              </p>
            )}
          </div>

          {/* File Info */}
          <div
            style={{
              padding: "12px",
              backgroundColor: BRAND_LIGHT,
              borderRadius: "6px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: STATUS_GRAY,
              }}
            >
              File: <strong>{fileName}</strong>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px",
            borderTop: `1px solid ${BRAND_LIGHT}`,
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            type="button"
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: `1px solid ${BRAND_LIGHT}`,
              backgroundColor: "white",
              color: BRAND_DARK,
              fontSize: "14px",
              fontWeight: 500,
              cursor: isExporting ? "not-allowed" : "pointer",
              opacity: isExporting ? 0.6 : 1,
              transition: "all 0.2s ease",
              minHeight: "44px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            type="button"
            aria-busy={isExporting}
            style={{
              padding: "10px 24px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: BRAND_ORANGE,
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isExporting ? "not-allowed" : "pointer",
              opacity: isExporting ? 0.7 : 1,
              transform: isExporting ? "none" : "translateY(0)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isExporting) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 140, 0, 0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>
    </div>
  );
};
