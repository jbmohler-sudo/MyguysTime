import React, { useEffect, useState } from "react";
import type { PayrollExportRecord } from "../types/payroll";

interface Props {
  onFetchHistory: () => Promise<PayrollExportRecord[]>;
}

export const PayrollExportHistory: React.FC<Props> = ({ onFetchHistory }) => {
  const [records, setRecords] = useState<PayrollExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onFetchHistory()
      .then(setRecords)
      .catch(() => setError("Failed to load export history."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "16px", color: "#666", fontSize: "14px" }}>
        Loading export history…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "16px", color: "#c0392b", fontSize: "14px" }}>
        {error}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div style={{ padding: "16px", color: "#666", fontSize: "14px" }}>
        No exports yet for this company.
      </div>
    );
  }

  const kindLabel = (kind: string) => kind.toUpperCase();

  return (
    <div className="export-history-table">
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #E0E0E0", color: "#555", fontWeight: 600 }}>Week</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #E0E0E0", color: "#555", fontWeight: 600 }}>Type</th>
            <th style={{ textAlign: "right", padding: "8px", borderBottom: "2px solid #E0E0E0", color: "#555", fontWeight: 600 }}>Rows</th>
            <th style={{ textAlign: "right", padding: "8px", borderBottom: "2px solid #E0E0E0", color: "#555", fontWeight: 600 }}>Hours</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #E0E0E0", color: "#555", fontWeight: 600 }}>Exported By</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #E0E0E0", color: "#555", fontWeight: 600 }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
              <td style={{ padding: "8px" }}>{r.weekStart}</td>
              <td style={{ padding: "8px" }}>
                <span style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor: r.exportKind === "qbo" ? "#e8f4fd" : "#f0f0f0",
                  color: r.exportKind === "qbo" ? "#1a5276" : "#555",
                  fontSize: "11px",
                  fontWeight: 600,
                }}>
                  {kindLabel(r.exportKind)}
                </span>
              </td>
              <td style={{ padding: "8px", textAlign: "right" }}>{r.totalRows}</td>
              <td style={{ padding: "8px", textAlign: "right" }}>{r.totalHours.toFixed(2)}</td>
              <td style={{ padding: "8px" }}>{r.exportedBy}</td>
              <td style={{ padding: "8px", color: "#888" }}>
                {new Date(r.exportedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
