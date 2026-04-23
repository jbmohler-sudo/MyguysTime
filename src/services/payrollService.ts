import { downloadExport, fetchExportHistory, fetchQboPreview } from "../lib/api";
import type { ExportPreview, PayrollExportRecord } from "../types/payroll";

let _token: string | null = null;

export function setPayrollServiceToken(token: string | null) {
  _token = token;
}

function getToken(): string {
  if (!_token) throw new Error("Not authenticated");
  return _token;
}

export const payrollService = {
  async getQboPreview(weekStart: string): Promise<ExportPreview> {
    return fetchQboPreview(getToken(), weekStart);
  },

  async downloadQboCsv(weekStart: string): Promise<Response> {
    return downloadExport(getToken(), `/exports/qbo.csv?weekStart=${encodeURIComponent(weekStart)}`);
  },

  async getExportHistory(): Promise<PayrollExportRecord[]> {
    const result = await fetchExportHistory(getToken());
    return result.exports;
  },
};
