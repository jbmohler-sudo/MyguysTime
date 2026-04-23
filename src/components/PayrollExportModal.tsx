import React, { useMemo, useRef, useState } from "react";
import type { BootstrapPayload } from "../domain/models";
import type { ExportPreview, PayrollExportRecord } from "../types/payroll";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useAnalytics } from "../hooks/useAnalytics";
import { PayrollExportHistory } from "./PayrollExportHistory";

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
  weekStart?: string;
  selectedWeekRange?: { startDate: string; endDate: string };
  onClose: () => void;
  onExport: (csvContent: string, fileName: string) => void;
  onFetchQboPreview?: (weekStart: string) => Promise<ExportPreview>;
  onDownloadQboCsv?: (weekStart: string) => Promise<Response>;
  onFetchHistory?: () => Promise<PayrollExportRecord[]>;
}

type ActiveTab = "standard" | "qbo" | "history";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1A";
const BRAND_LIGHT = "#F5F5F5";
const STATUS_GRAY = "#808080";

export const PayrollExportModal: React.FC<PayrollExportModalProps> = ({
  isOpen,
  data,
  weekStart,
  selectedWeekRange,
  onClose,
  onExport,
  onFetchQboPreview,
  onDownloadQboCsv,
  onFetchHistory,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("standard");
  const [qboPreview, setQboPreview] = useState<ExportPreview | null>(null);
  const [qboLoading, setQboLoading] = useState(false);
  const [qboError, setQboError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analytics = useAnalytics();

  useFocusTrap(containerRef, isOpen, onClose);

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

  const generateCSV = (): { csvContent: string; fileName: string } => {
    const headers = ["Employee Name", "Regular Hours", "Overtime Hours", "Total Hours", "Gross Pay", "Status"];
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
      await new Promise((resolve) => setTimeout(resolve, 500));
      onExport(csvContent, fileName);
      analytics.trackFeatureUsage("payroll", "exported", { employeeCount: exportData.length });
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  const handleTabChange = async (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === "qbo" && !qboPreview && onFetchQboPreview && weekStart) {
      setQboLoading(true);
      setQboError(null);
      try {
        const preview = await onFetchQboPreview(weekStart);
        setQboPreview(preview);
      } catch {
        setQboError("Failed to load QBO preview.");
      } finally {
        setQboLoading(false);
      }
    }
  };

  const handleQboDownload = async () => {
    if (!onDownloadQboCsv || !weekStart) return;
    setIsExporting(true);
    try {
      const response = await onDownloadQboCsv(weekStart);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qbo-time-${weekStart}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      analytics.trackFeatureUsage("payroll", "qbo_exported", { weekStart });
      onClose();
    } catch {
      setQboError("QBO export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const { fileName } = generateCSV();
  const showQboTab = !!onFetchQboPreview;
  const showHistoryTab = !!onFetchHistory;

  const tabStyle = (tab: ActiveTab): React.CSSProperties => ({
    padding: "10px 16px",
    border: "none",
    borderBottom: activeTab === tab ? `2px solid ${BRAND_ORANGE}` : "2px solid transparent",
    backgroundColor: "transparent",
    color: activeTab === tab ? BRAND_ORANGE : STATUS_GRAY,
    fontWeight: activeTab === tab ? 600 : 400,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

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
            padding: "24px 24px 0",
            borderBottom: `1px solid ${BRAND_LIGHT}`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2
              id="payroll-export-title"
              style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: BRAND_DARK }}
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

          {/* Tabs */}
          {(showQboTab || showHistoryTab) && (
            <div style={{ display: "flex", gap: "4px" }}>
              <button style={tabStyle("standard")} onClick={() => handleTabChange("standard")} type="button">
                Standard CSV
              </button>
              {showQboTab && (
                <button style={tabStyle("qbo")} onClick={() => handleTabChange("qbo")} type="button">
                  QBO Export
                </button>
              )}
              {showHistoryTab && (
                <button style={tabStyle("history")} onClick={() => handleTabChange("history")} type="button">
                  History
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>

          {/* Standard CSV tab */}
          {activeTab === "standard" && (
            <>
              <div
                style={{
                  backgroundColor: "rgba(255, 140, 0, 0.05)",
                  border: `1px solid rgba(255, 140, 0, 0.2)`,
                  borderRadius: "6px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", color: BRAND_DARK, lineHeight: 1.5 }}>
                  <strong>Ready to export {exportData.length} employee records</strong>
                  <br />
                  {selectedWeekRange
                    ? `Period: ${selectedWeekRange.startDate} to ${selectedWeekRange.endDate}`
                    : "All available data will be included."}
                </p>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: BRAND_DARK }}>
                  Preview
                </h3>
                <div style={{ overflowX: "auto", border: `1px solid ${BRAND_LIGHT}`, borderRadius: "6px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ backgroundColor: BRAND_LIGHT, borderBottom: `2px solid ${BRAND_ORANGE}` }}>
                        <th style={{ padding: "10px", textAlign: "left", fontWeight: 600, color: BRAND_DARK }}>Employee</th>
                        <th style={{ padding: "10px", textAlign: "right", fontWeight: 600, color: BRAND_DARK }}>Reg Hrs</th>
                        <th style={{ padding: "10px", textAlign: "right", fontWeight: 600, color: BRAND_DARK }}>OT Hrs</th>
                        <th style={{ padding: "10px", textAlign: "right", fontWeight: 600, color: BRAND_DARK }}>Total Hrs</th>
                        <th style={{ padding: "10px", textAlign: "right", fontWeight: 600, color: BRAND_DARK }}>Gross Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.slice(0, 10).map((row, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: `1px solid ${BRAND_LIGHT}`, backgroundColor: idx % 2 === 0 ? "white" : BRAND_LIGHT }}
                        >
                          <td style={{ padding: "10px", color: BRAND_DARK }}>{row.employeeName}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: BRAND_DARK }}>{row.regularHours.toFixed(2)}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: BRAND_DARK }}>{row.overtimeHours.toFixed(2)}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: BRAND_DARK }}>{row.weeklyTotalHours.toFixed(2)}</td>
                          <td style={{ padding: "10px", textAlign: "right", color: BRAND_DARK, fontWeight: 600 }}>${row.grossPay.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {exportData.length > 10 && (
                  <p style={{ marginTop: "8px", fontSize: "12px", color: STATUS_GRAY }}>
                    Showing 10 of {exportData.length} employees
                  </p>
                )}
              </div>

              <div style={{ padding: "12px", backgroundColor: BRAND_LIGHT, borderRadius: "6px", marginBottom: "24px" }}>
                <p style={{ margin: 0, fontSize: "12px", color: STATUS_GRAY }}>
                  File: <strong>{fileName}</strong>
                </p>
              </div>
            </>
          )}

          {/* QBO Export tab */}
          {activeTab === "qbo" && (
            <>
              <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#555", lineHeight: 1.5 }}>
                QuickBooks Online (QBO) format exports one row per employee per day. Import this file
                into QBO under <strong>Time Activities → Import</strong>.
              </p>

              {qboLoading && (
                <div style={{ padding: "24px", textAlign: "center", color: STATUS_GRAY, fontSize: "14px" }}>
                  Loading preview…
                </div>
              )}

              {qboError && (
                <div style={{
                  padding: "12px 16px",
                  backgroundColor: "#fdf2f2",
                  border: "1px solid #f5c6c6",
                  borderRadius: "6px",
                  color: "#c0392b",
                  fontSize: "14px",
                  marginBottom: "16px",
                }}>
                  {qboError}
                </div>
              )}

              {qboPreview && !qboLoading && (
                <>
                  <div className="export-summary" style={{ marginBottom: "20px" }}>
                    <div className="summary-row" style={{ display: "flex", gap: "16px", flexWrap: "wrap" as const, marginBottom: "16px" }}>
                      <div style={{ flex: 1, minWidth: "120px", padding: "12px 16px", backgroundColor: BRAND_LIGHT, borderRadius: "6px" }}>
                        <div style={{ fontSize: "11px", color: STATUS_GRAY, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: "4px" }}>Employees</div>
                        <div style={{ fontSize: "22px", fontWeight: 700, color: BRAND_DARK }}>{qboPreview.totalEmployees}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: "120px", padding: "12px 16px", backgroundColor: BRAND_LIGHT, borderRadius: "6px" }}>
                        <div style={{ fontSize: "11px", color: STATUS_GRAY, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: "4px" }}>Total Hours</div>
                        <div style={{ fontSize: "22px", fontWeight: 700, color: BRAND_DARK }}>{qboPreview.totalHours.toFixed(2)}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: "120px", padding: "12px 16px", backgroundColor: BRAND_LIGHT, borderRadius: "6px" }}>
                        <div style={{ fontSize: "11px", color: STATUS_GRAY, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: "4px" }}>Week</div>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: BRAND_DARK }}>{qboPreview.weekStart}</div>
                      </div>
                    </div>

                    {qboPreview.warnings.length > 0 && (
                      <div style={{
                        padding: "12px 16px",
                        backgroundColor: "#fffbf0",
                        border: "1px solid #f0c040",
                        borderRadius: "6px",
                        marginBottom: "12px",
                      }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#856404", marginBottom: "6px" }}>
                          Warnings ({qboPreview.warnings.length})
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#856404" }}>
                          {qboPreview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}

                    {qboPreview.errors.length > 0 && (
                      <div style={{
                        padding: "12px 16px",
                        backgroundColor: "#fdf2f2",
                        border: "1px solid #f5c6c6",
                        borderRadius: "6px",
                        marginBottom: "12px",
                      }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#c0392b", marginBottom: "6px" }}>
                          Errors ({qboPreview.errors.length})
                        </div>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#c0392b" }}>
                          {qboPreview.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* History tab */}
          {activeTab === "history" && onFetchHistory && (
            <PayrollExportHistory onFetchHistory={onFetchHistory} />
          )}
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

          {activeTab === "standard" && (
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
                transition: "all 0.2s ease",
                minHeight: "44px",
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
          )}

          {activeTab === "qbo" && onDownloadQboCsv && (
            <button
              onClick={handleQboDownload}
              disabled={isExporting || !qboPreview?.isReady}
              type="button"
              aria-busy={isExporting}
              style={{
                padding: "10px 24px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: qboPreview?.isReady ? BRAND_ORANGE : "#ccc",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                cursor: (isExporting || !qboPreview?.isReady) ? "not-allowed" : "pointer",
                opacity: isExporting ? 0.7 : 1,
                transition: "all 0.2s ease",
                minHeight: "44px",
              }}
              onMouseEnter={(e) => {
                if (!isExporting && qboPreview?.isReady) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 140, 0, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {isExporting ? "Downloading..." : "Download QBO CSV"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
