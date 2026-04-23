# Claude Code Prompt: Integrate PayrollExportModal into AppShell

## Overview
Wire the new `PayrollExportModal` component into AppShell with export button, CSV generation, and toast notifications.

## Step 1: Import PayrollExportModal and Toast Utilities

Add these imports at the top of `src/components/AppShell.tsx`:

```typescript
import { PayrollExportModal } from "./PayrollExportModal";
```

Also ensure you have a toast notification utility. If one doesn't exist, create a simple toast hook:
- Add a new hook `src/hooks/useToast.ts` that manages toast state
- Or use a lightweight toast library like `sonner` (install with: `npm install sonner`)

## Step 2: Add State for Payroll Export Modal

Add this state variable inside the AppShell component, near the existing state declarations:

```typescript
const [showPayrollModal, setShowPayrollModal] = useState(false);
```

## Step 3: Add Export Handler

Add this handler function inside AppShell, near the other event handlers:

```typescript
const handlePayrollExport = (csvContent: string, fileName: string) => {
  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Show success toast
  // If using sonner:
  // toast.success(`Payroll exported: ${fileName}`);
  // If using custom hook:
  // showToast("success", `Payroll exported: ${fileName}`);
  console.log(`✓ Exported ${fileName}`);
};
```

## Step 4: Add Export Button to Header

Locate the header section in AppShell (around line ~60-80, inside the sticky header).

Add an "Export Payroll" button before the Mode Pill. Position it in the top-right area of the header:

```typescript
<button
  onClick={() => setShowPayrollModal(true)}
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
  📥 Export Payroll
</button>
```

**Placement note:** Position this button in a flex container in the header's right section, next to or before the Mode Pill.

## Step 5: Render the PayrollExportModal

Add this after the closing `</main>` tag (around line ~350-380):

```typescript
<PayrollExportModal
  isOpen={showPayrollModal}
  data={bootstrapPayload}
  onClose={() => setShowPayrollModal(false)}
  onExport={handlePayrollExport}
/>
```

## Step 6: Verify Props and Data Flow

- Confirm `bootstrapPayload` is available in AppShell's scope (it should be from the parent)
- Ensure `data.employeeWeeks` contains week records with `entries` array
- Ensure `data.managedEmployees` contains employee records with `hourlyRate` field
- The modal will generate CSV with: Employee Name, Regular Hours, Overtime Hours, Total Hours, Gross Pay, Status

## Step 7: Test the Integration

### Visibility Test
- [ ] Verify "Export Payroll" button appears in header (top-right, before Mode Pill)
- [ ] Button has orange background with hover lift effect
- [ ] Button is visible on both office and truck modes

### Modal Test
- [ ] Click "Export Payroll" button → modal opens
- [ ] Modal displays preview table with employee data (max 10 rows shown, overflow indicated)
- [ ] Modal shows info box with employee count
- [ ] Modal displays file name: `payroll-export-YYYY-MM-DD.csv`
- [ ] "Cancel" button closes modal
- [ ] Clicking outside modal also closes it

### Export Test
- [ ] Click "Export CSV" button → CSV downloads (check browser downloads folder)
- [ ] File name matches format: `payroll-export-YYYY-MM-DD.csv`
- [ ] CSV content includes headers: Employee Name, Regular Hours, Overtime Hours, Total Hours, Gross Pay, Status
- [ ] CSV contains all employees from data.employeeWeeks (deduplicated, sorted by name)
- [ ] Hours calculations are correct:
  - Regular hours = min(40, totalHours)
  - Overtime hours = max(0, totalHours - 40)
  - Total hours = sum of all day entries
  - Gross pay = (regularHours × hourlyRate) + (overtimeHours × hourlyRate × 1.5)
- [ ] Success toast appears (if implemented)

### Data Correctness Test
- [ ] Export includes all active employees
- [ ] Employees from multiple weeks are deduplicated and summed correctly
- [ ] Hourly rate defaults to $20/hr for employees without a managed employee record
- [ ] Status field shows "Active" or "Inactive" based on ManagedEmployee.isActive

### Styling Test
- [ ] Modal background is white with rounded corners and shadow
- [ ] Close button (✕) appears in top-right
- [ ] Preview table has alternating row colors (white / light gray)
- [ ] Table header has orange bottom border
- [ ] Info box has light orange background
- [ ] All text is readable and properly spaced
- [ ] Modal works on mobile (max-width: 720px) → adjust modal width to 90vw

### Edge Cases
- [ ] Empty employee list → "Ready to export 0 employee records" message
- [ ] Single employee → preview shows 1 row
- [ ] More than 10 employees → "Showing 10 of X employees" text appears

## Notes

- The modal is self-contained and handles CSV generation internally
- No backend call is required; CSV is generated client-side
- File download uses browser's native download API
- Modal closes automatically after successful export (optional behavior)
- Toast notification is optional but recommended for UX feedback

## Commit Message

```
feat: add payroll export modal with CSV preview and download

- New PayrollExportModal component with data preview table
- Export button in AppShell header (top-right)
- Client-side CSV generation from employeeWeeks and managedEmployees
- Overtime calculation (1.5x after 40 hours)
- Toast notification on export success
- Responsive design for mobile and desktop
```
