export interface QBORow {
  name: string;
  txnDate: string;
  time: number;
  customer: string;
  serviceItem: string;
  description: string;
}

export interface ExportPreview {
  weekStart: string;
  totalEmployees: number;
  totalHours: number;
  warnings: string[];
  errors: string[];
  isReady: boolean;
}

export interface PayrollExportRecord {
  id: string;
  weekStart: string;
  exportKind: string;
  totalRows: number;
  totalHours: number;
  fileName: string;
  exportedAt: string;
  exportedBy: string;
}
