# Claude Code Prompt: QuickBooks Online (QBO) Export System

## Executive Summary

Build the complete QBO export pipeline: backend CSV generation with validation, pre-export preview API, React modal with approval gatekeeping, Prisma schema updates, and audit logging. This bridges field timesheets → QBO payroll with precise data mapping and company isolation.

**Outcome:** Admins can preview payroll, approve export, download CSV, and track exports in audit history. All data scoped by company via JWT + RLS.

**Timeline:** All 12 steps in one continuous run.

---

## Phase 1: Database & Backend Validation

### Step 1: Update Prisma Schema

**File:** `prisma/schema.prisma`

Add three new models:

```prisma
model PayrollExport {
  id            String   @id @default(cuid())
  companyId     String   @db.Uuid
  company       Company  @relation(fields: [companyId], references: [id])
  
  startDate     DateTime
  endDate       DateTime
  
  totalRows     Int
  totalHours    Decimal
  fileName      String
  
  exportedBy    String   @db.Uuid
  exportedByUser User    @relation(fields: [exportedBy], references: [id])
  
  exportedAt    DateTime @default(now())
  createdAt     DateTime @default(now())
  
  @@index([companyId])
  @@index([exportedAt])
}

model QBOConnection {
  id            String   @id @default(cuid())
  companyId     String   @db.Uuid @unique
  company       Company  @relation(fields: [companyId], references: [id])
  
  realm_id      String   // QBO company ID
  access_token  String   // Encrypted
  refresh_token String   // Encrypted
  expires_at    DateTime
  
  connected_by_user_id String @db.Uuid
  connected_by_user    User   @relation(fields: [connected_by_user_id], references: [id])
  
  connected_at  DateTime @default(now())
  disconnected_at DateTime?
  
  @@index([companyId])
}

// Update EmployeeWeek model (add these fields)
model EmployeeWeek {
  // ... existing fields ...
  
  exportedAt    DateTime?
  exportedBy    String?   @db.Uuid
  exportedByUser User?    @relation(fields: [exportedBy], references: [id])
}

// Update Company model (add these relations)
model Company {
  // ... existing fields ...
  
  payrollExports PayrollExport[]
  qboConnection  QBOConnection?
}

// Update User model (add these relations)
model User {
  // ... existing fields ...
  
  payrollExportsCreated PayrollExport[]
  employeeWeeksExported EmployeeWeek[]
  qboConnectionsCreated QBOConnection[]
}
```

**Success check:**
- ✅ Schema compiles without errors
- ✅ `npx prisma migrate dev` succeeds
- ✅ New tables created in Neon DB

### Step 2: Create Types & Validation Utils

**File:** `src/types/payroll.ts`

```typescript
export interface QBORow {
  NAME: string;
  TXNDATE: string; // YYYY-MM-DD
  TIME: string;    // Decimal: 5.50
  CUSTOMER: string;
  SERVICEITEM: string;
  DESCRIPTION: string;
}

export interface ExportPreview {
  totalEmployees: number;
  totalHours: number;
  estimatedGrossPayroll: number;
  warnings: string[];
  errors: string[];
  isReady: boolean;
}

export interface ExportRequest {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  approvalConfirmed: boolean;
}

export interface PayrollExportRecord {
  id: string;
  startDate: Date;
  endDate: Date;
  exportedAt: Date;
  exportedBy: string;
  totalRows: number;
  totalHours: number;
  fileName: string;
}
```

**File:** `src/utils/payrollValidation.ts`

```typescript
import { EmployeeWeek, ManagedEmployee } from '@prisma/client';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export function validateExportData(
  weeks: (EmployeeWeek & { managedEmployee: ManagedEmployee })[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  weeks.forEach((week) => {
    // Check 1: Hours > 0
    if (week.totalHours === 0) {
      warnings.push(
        `${week.date.toISOString().split('T')[0]}: ${week.managedEmployee.name} has 0 hours (excluded)`
      );
    }

    // Check 2: Valid name
    if (!week.managedEmployee.name || week.managedEmployee.name.length < 2) {
      errors.push(`Invalid name for employee ${week.managedEmployeeId}`);
    }

    // Check 3: Hours within bounds
    if (week.totalHours > 24) {
      errors.push(
        `${week.managedEmployee.name}: ${week.totalHours} hours exceeds 24-hour maximum`
      );
    }

    // Check 4: Description validation
    if (week.description && /^\d+$/.test(week.description)) {
      warnings.push(`Description is pure number: "${week.description}" (will be sanitized)`);
    }
  });

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

export function sanitizeDescription(desc: string | null): string {
  if (!desc) return '';
  return desc.replace(/^\d+\s*/, '').trim();
}

export function formatTimeDecimal(hours: number): string {
  return hours.toFixed(2);
}

export function generateCSVLine(row: Record<string, string>): string {
  return Object.values(row)
    .map((val) => {
      // Quote strings that contain commas or quotes
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    })
    .join(',');
}

export function generateCSV(rows: Record<string, string>[]): string {
  const headers = ['NAME', 'TXNDATE', 'TIME', 'CUSTOMER', 'SERVICEITEM', 'DESCRIPTION'];
  const csvLines = [headers.join(',')];

  rows.forEach((row) => {
    csvLines.push(generateCSVLine(row));
  });

  // Add UTF-8 BOM for special characters
  return '\uFEFF' + csvLines.join('\n');
}
```

**Success check:**
- ✅ TypeScript compiles with zero errors
- ✅ Validation functions return correct ValidationResult shape

---

## Phase 2: Backend API Routes

### Step 3: Create Export Service

**File:** `src/services/payrollExportService.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { ExportPreview, ExportRequest, QBORow } from '../types/payroll';
import {
  validateExportData,
  sanitizeDescription,
  formatTimeDecimal,
  generateCSV,
} from '../utils/payrollValidation';

const prisma = new PrismaClient();

export class PayrollExportService {
  async getExportPreview(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExportPreview> {
    // Fetch weeks with company scoping
    const weeks = await prisma.employeeWeek.findMany({
      where: {
        managedEmployee: {
          companyId, // Company isolation
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        managedEmployee: true,
      },
    });

    // Validate
    const validation = validateExportData(weeks);

    // Calculate totals (excluding zero-hour entries)
    const validWeeks = weeks.filter((w) => w.totalHours > 0);
    const totalHours = validWeeks.reduce((sum, w) => sum + w.totalHours, 0);
    const totalEmployees = new Set(validWeeks.map((w) => w.managedEmployeeId)).size;

    // Estimate payroll (would use actual hourly rates in production)
    const estimatedGrossPayroll = validWeeks.reduce(
      (sum, w) => sum + w.totalHours * (w.managedEmployee.hourlyRate || 25),
      0
    );

    return {
      totalEmployees,
      totalHours,
      estimatedGrossPayroll,
      warnings: validation.warnings,
      errors: validation.errors,
      isReady: validation.isValid,
    };
  }

  async generateExport(
    companyId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<{ csv: string; fileName: string }> {
    // Fetch weeks
    const weeks = await prisma.employeeWeek.findMany({
      where: {
        managedEmployee: {
          companyId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        managedEmployee: true,
      },
    });

    // Validate
    const validation = validateExportData(weeks);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    // Map to QBO rows (exclude zero-hour entries)
    const qboRows: QBORow[] = weeks
      .filter((w) => w.totalHours > 0)
      .map((week) => ({
        NAME: week.managedEmployee.name,
        TXNDATE: week.date.toISOString().split('T')[0],
        TIME: formatTimeDecimal(week.totalHours),
        CUSTOMER: week.crewName || 'Unassigned',
        SERVICEITEM: 'Masonry Labor',
        DESCRIPTION: sanitizeDescription(week.description),
      }));

    // Generate CSV
    const csv = generateCSV(
      qboRows.map((row) => ({
        NAME: row.NAME,
        TXNDATE: row.TXNDATE,
        TIME: row.TIME,
        CUSTOMER: row.CUSTOMER,
        SERVICEITEM: row.SERVICEITEM,
        DESCRIPTION: row.DESCRIPTION,
      }))
    );

    const fileName = `MyGuysTime_${startDate.toISOString().split('T')[0]}_to_${endDate
      .toISOString()
      .split('T')[0]}.csv`;

    // Log export for audit trail
    await prisma.payrollExport.create({
      data: {
        companyId,
        startDate,
        endDate,
        exportedBy: userId,
        totalRows: qboRows.length,
        totalHours: qboRows.reduce((sum, r) => sum + parseFloat(r.TIME), 0),
        fileName,
      },
    });

    // Update weeks as exported
    await prisma.employeeWeek.updateMany({
      where: {
        id: { in: weeks.map((w) => w.id) },
      },
      data: {
        exportedAt: new Date(),
        exportedBy: userId,
      },
    });

    return { csv, fileName };
  }

  async getExportHistory(companyId: string, limit: number = 50) {
    return prisma.payrollExport.findMany({
      where: { companyId },
      orderBy: { exportedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        exportedAt: true,
        exportedBy: true,
        totalRows: true,
        totalHours: true,
        fileName: true,
      },
    });
  }
}

export const payrollExportService = new PayrollExportService();
```

**Success check:**
- ✅ Service methods return correct types
- ✅ Company isolation enforced (companyId in where clause)
- ✅ No cross-company data leaks

### Step 4: Create Express Routes

**File:** `src/routes/payroll.ts`

```typescript
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { payrollExportService } from '../services/payrollExportService';
import { ExportRequest } from '../types/payroll';

const router = Router();

// Require auth on all payroll routes
router.use(authMiddleware);

// GET /api/company/payroll/export-preview
router.post('/export-preview', async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized: No company ID' });
    }

    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Missing startDate or endDate' });
    }

    const preview = await payrollExportService.getExportPreview(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );

    res.json(preview);
  } catch (error) {
    console.error('Export preview error:', error);
    res.status(500).json({ error: 'Failed to load preview' });
  }
});

// POST /api/company/payroll/export-to-qbo
router.post('/export-to-qbo', async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;

    if (!companyId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { startDate, endDate, approvalConfirmed }: ExportRequest = req.body;

    if (!startDate || !endDate || !approvalConfirmed) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { csv, fileName } = await payrollExportService.generateExport(
      companyId,
      new Date(startDate),
      new Date(endDate),
      userId
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export payroll' });
  }
});

// GET /api/company/payroll/export-history
router.get('/export-history', async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized: No company ID' });
    }

    const history = await payrollExportService.getExportHistory(companyId);

    res.json(history);
  } catch (error) {
    console.error('Export history error:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

export default router;
```

**Wire into main Express app:**

```typescript
// In src/server.ts or main Express file
import payrollRouter from './routes/payroll';

app.use('/api/company/payroll', payrollRouter);
```

**Success check:**
- ✅ Routes respond with correct status codes (200 for success, 400 for bad request, 401 for auth, 500 for error)
- ✅ All routes check companyId from JWT
- ✅ CSV is correctly formatted and downloadable

---

## Phase 3: React Types & Service

### Step 5: Create React Types & Service

**File:** `src/types/payroll.ts` (React layer - if separate from backend types)

Already created in Step 2. Just reference from `src/types/payroll.ts`.

**File:** `src/services/payrollService.ts`

```typescript
import { ExportRequest, ExportPreview, PayrollExportRecord } from '../types/payroll';

export const payrollService = {
  async getExportPreview(startDate: string, endDate: string): Promise<ExportPreview> {
    const response = await fetch('/api/company/payroll/export-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load preview');
    }

    return response.json();
  },

  async exportToQBO(
    startDate: string,
    endDate: string,
    approvalConfirmed: boolean
  ): Promise<Blob> {
    const response = await fetch('/api/company/payroll/export-to-qbo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, approvalConfirmed }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export');
    }

    return response.blob();
  },

  async getExportHistory(): Promise<PayrollExportRecord[]> {
    const response = await fetch('/api/company/payroll/export-history');

    if (!response.ok) {
      throw new Error('Failed to load export history');
    }

    return response.json();
  },
};
```

**Success check:**
- ✅ Service methods wrap API calls correctly
- ✅ Error handling throws descriptive messages
- ✅ Blob returned from exportToQBO for CSV download

---

## Phase 4: React Components

### Step 6: Create PayrollExportModal Component

**File:** `src/components/PayrollExportModal.tsx`

```typescript
import { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { payrollService } from '../services/payrollService';
import { ExportPreview } from '../types/payroll';

interface PayrollExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: { start: Date; end: Date };
  onExportSuccess: () => void;
}

export function PayrollExportModal({
  isOpen,
  onClose,
  dateRange,
  onExportSuccess,
}: PayrollExportModalProps) {
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'preview' | 'confirm'>('preview');

  const startDateStr = dateRange.start.toISOString().split('T')[0];
  const endDateStr = dateRange.end.toISOString().split('T')[0];

  const handleLoadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await payrollService.getExportPreview(startDateStr, endDateStr);
      setPreview(data);
      setStep('confirm');

      trackEvent('payroll_export_preview_loaded', {
        totalEmployees: data.totalEmployees,
        totalHours: data.totalHours,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      trackEvent('payroll_preview_failed', { error: message });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const blob = await payrollService.exportToQBO(startDateStr, endDateStr, true);

      // Download CSV
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MyGuysTime_${startDateStr}_to_${endDateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      trackEvent('payroll_exported', {
        totalHours: preview?.totalHours,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      onExportSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      trackEvent('payroll_export_failed', { error: message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal--payroll-export" role="dialog" aria-modal="true">
      <div className="modal__overlay" onClick={onClose} />

      <div className="modal__content">
        <div className="modal__header">
          <h2 id="export-title">Export Payroll to QuickBooks</h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close export dialog"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        {step === 'preview' ? (
          <div className="modal__body">
            <p>Review your payroll data before exporting to QuickBooks.</p>
            <p className="form__help">
              Date range: <strong>{startDateStr}</strong> to <strong>{endDateStr}</strong>
            </p>

            <button
              className="btn btn--primary"
              onClick={handleLoadPreview}
              disabled={loading}
              aria-label="Load export preview"
            >
              {loading ? 'Loading Preview...' : 'Load Preview'}
            </button>
          </div>
        ) : (
          <div className="modal__body">
            {preview && (
              <div className="export-summary">
                <h3>Export Summary</h3>

                <div className="summary-row">
                  <span>Employees:</span>
                  <strong>{preview.totalEmployees}</strong>
                </div>

                <div className="summary-row">
                  <span>Total Hours:</span>
                  <strong>{preview.totalHours.toFixed(2)}</strong>
                </div>

                <div className="summary-row">
                  <span>Estimated Payroll:</span>
                  <strong>${preview.estimatedGrossPayroll.toFixed(2)}</strong>
                </div>

                {preview.warnings.length > 0 && (
                  <div className="alert alert--warning">
                    <strong>Warnings:</strong>
                    <ul>
                      {preview.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {preview.errors.length > 0 && (
                  <div className="alert alert--error">
                    <strong>Errors:</strong>
                    <ul>
                      {preview.errors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          {step === 'confirm' && preview && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleExport}
              disabled={loading || !preview.isReady}
            >
              {loading ? 'Exporting...' : 'Export to QBO'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 7: Create PayrollExportHistory Component

**File:** `src/components/PayrollExportHistory.tsx`

```typescript
import { useEffect, useState } from 'react';
import { payrollService } from '../services/payrollService';
import { PayrollExportRecord } from '../types/payroll';

export function PayrollExportHistory() {
  const [history, setHistory] = useState<PayrollExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await payrollService.getExportHistory();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading export history...</div>;

  if (history.length === 0) {
    return <div className="empty-state">No exports yet.</div>;
  }

  return (
    <div className="export-history">
      <h3>Export History</h3>
      <table className="export-history-table">
        <thead>
          <tr>
            <th>Date Range</th>
            <th>Rows</th>
            <th>Hours</th>
            <th>Exported By</th>
            <th>Exported At</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          {history.map((record) => (
            <tr key={record.id}>
              <td>
                {new Date(record.startDate).toLocaleDateString()} to{' '}
                {new Date(record.endDate).toLocaleDateString()}
              </td>
              <td>{record.totalRows}</td>
              <td>{record.totalHours.toFixed(2)}</td>
              <td>{record.exportedBy}</td>
              <td>{new Date(record.exportedAt).toLocaleString()}</td>
              <td>{record.fileName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Success check:**
- ✅ Modal renders with 2-step flow (preview → confirm)
- ✅ Preview loads data + shows summary
- ✅ Export downloads CSV with correct filename
- ✅ History table displays audit trail

---

## Phase 5: Styling

### Step 8: Add CSS for Export Modal & History

**File:** `src/styles.css`

```css
/* Export Modal */
.modal--payroll-export .modal__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.modal--payroll-export .modal__content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

/* Export Summary */
.export-summary {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}

.export-summary h3 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.95rem;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row span {
  color: #6b7280;
}

.summary-row strong {
  color: var(--color-primary-orange);
  font-weight: 600;
}

/* Alert Styles */
.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.alert--warning {
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid #fbbf24;
  color: #92400e;
}

.alert--warning strong {
  color: #d97706;
}

.alert--error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid #f87171;
  color: #7f1d1d;
}

.alert--error strong {
  color: #dc2626;
}

.alert ul {
  margin: 8px 0 0 20px;
  padding: 0;
}

.alert li {
  margin: 4px 0;
}

/* Export History Table */
.export-history {
  margin-top: 24px;
}

.export-history h3 {
  margin: 0 0 12px 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.export-history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.export-history-table thead {
  background-color: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
}

.export-history-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #4b5563;
}

.export-history-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.export-history-table tbody tr:hover {
  background-color: #f9fafb;
}

/* Form Help Text */
.form__help {
  margin: 8px 0;
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

/* Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-size: 0.95rem;
}
```

---

## Phase 6: Integration & Analytics

### Step 9: Wire Modal into AppShell

**File:** `src/components/AppShell.tsx` (or wherever payroll export is triggered)

```typescript
import { PayrollExportModal } from './PayrollExportModal';
import { useState } from 'react';

export function AppShell({ data }) {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const handleOpenExportModal = () => {
    // Set date range based on current week or selection
    setIsExportModalOpen(true);
  };

  return (
    <div className="app-shell">
      {/* ... existing content ... */}

      {/* Export Button */}
      <button
        className="btn btn--primary"
        onClick={handleOpenExportModal}
        aria-label="Export payroll to QuickBooks"
      >
        📊 Export to QBO
      </button>

      {/* Export Modal */}
      <PayrollExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dateRange={selectedDateRange}
        onExportSuccess={() => {
          // Refresh employee list or show success toast
        }}
      />

      {/* ... rest of content ... */}
    </div>
  );
}
```

### Step 10: Wire Analytics

Add tracking to PayrollExportModal:

```typescript
// Already included in PayrollExportModal code above:
trackEvent('payroll_export_preview_loaded', { totalEmployees, totalHours });
trackEvent('payroll_preview_failed', { error });
trackEvent('payroll_exported', { totalHours, startDate, endDate });
trackEvent('payroll_export_failed', { error });
```

**Success check:**
- ✅ Analytics events logged to console in dev
- ✅ Events include correct metadata (dates, hours, error messages)

---

## Phase 7: Testing

### Step 11: Test All Scenarios

**Test Matrix:**

| Scenario | Expected Outcome |
|----------|------------------|
| Load preview for valid week | Shows 5 employees, 187.5 hours, $4,687.50 payroll |
| Week has one employee with 0 hours | Warning shown, row excluded from export |
| Description field is "123" | Sanitized to empty string in CSV |
| User from Company A tries to export Company B data | 401 Unauthorized (RLS blocks) |
| Non-admin user tries to export | Role check prevents access (frontend + backend) |
| Export button clicked 2x rapidly | Idempotency: same CSV generated |
| CSV downloads | File named correctly, headers match QBO format |
| Export history loads | Shows all past exports with timestamps |

### Step 12: Verify End-to-End

**Checklist:**

- ✅ Prisma migrations applied (`npx prisma migrate dev`)
- ✅ Routes accessible at `/api/company/payroll/*`
- ✅ Modal renders + loads preview without errors
- ✅ CSV downloads with correct filename + headers
- ✅ All company-scoped queries use `companyId` filter
- ✅ RLS policies prevent cross-company data leaks
- ✅ Audit trail logged in `PayrollExport` table
- ✅ TypeScript compiles with zero errors
- ✅ Analytics events tracked correctly
- ✅ Mobile responsive (modal, table, buttons)

---

## Files to Create/Modify

**Create (New):**
- `src/types/payroll.ts` (types)
- `src/utils/payrollValidation.ts` (validation logic)
- `src/services/payrollExportService.ts` (backend service)
- `src/services/payrollService.ts` (React service)
- `src/routes/payroll.ts` (Express routes)
- `src/components/PayrollExportModal.tsx` (React modal)
- `src/components/PayrollExportHistory.tsx` (React history table)

**Modify (Existing):**
- `prisma/schema.prisma` — Add PayrollExport, QBOConnection models, update EmployeeWeek + Company + User
- `src/styles.css` — Add modal + alert + table CSS
- `src/server.ts` or main Express file — Register `/api/company/payroll` router
- `src/components/AppShell.tsx` — Import + wire PayrollExportModal

---

## Success Criteria

- ✅ Admins can preview payroll before export
- ✅ CSV maps to QBO headers correctly (NAME, TXNDATE, TIME, CUSTOMER, SERVICEITEM, DESCRIPTION)
- ✅ All exports scoped by company (no cross-company leaks)
- ✅ Zero-hour entries excluded automatically
- ✅ Descriptions sanitized (no pure numbers)
- ✅ Export history viewable + auditable
- ✅ All routes check company isolation via JWT
- ✅ TypeScript passes with zero errors
- ✅ Analytics tracks all export events
- ✅ Mobile responsive UI
- ✅ Idempotency: repeated exports return same CSV

---

## Notes

- **QBO OAuth Integration (Future):** Realms IDs + token refresh are modeled in QBOConnection table but actual Intuit OAuth flow is Phase 2
- **Job Costing (Future):** Currently maps crew_name to CUSTOMER; enhance to support full project/cost code hierarchy
- **Bulk Upload (Future):** Direct QBO API push instead of CSV download for Phase 2
- **Encryption (Future):** Implement AES-256 encryption for `access_token` + `refresh_token` in QBOConnection table
