# Data Schema Mapping for Team Management Redesign

## Current Data Structures (from `src/domain/models.ts`)

### BootstrapPayload (Root data object)
```typescript
{
  viewer: Viewer,
  weekStart: string,
  companySettings: CompanySettingsSummary | null,
  stateRules: StateRuleSummary[],
  crews: CrewSummary[],           // ← Used by Team Panel
  employeeWeeks: EmployeeWeek[],  // ← Used by Team Panel + Alert System
  privateReports: PrivateReport[],
  archivedEmployees: ArchivedEmployee[]
}
```

---

## 1. CREWS (Team List)

### Source: `data.crews: CrewSummary[]`

```typescript
interface CrewSummary {
  id: string;
  name: string;
  foremanName: string;
  dayDefaults: CrewDayDefault[];
}
```

**For Team Management Panel:**
- ✅ `crew.id` — dropdown value
- ✅ `crew.name` — dropdown display label (e.g., "North Site Crew", "Truck 1")
- ✅ `crew.foremanName` — crew manager info (optional display)

**Used in:**
- AddEmployeeModal: Crew selection dropdown
- TeamManagementPanel: Filter by crew (if implemented)
- EmployeeWeek: References crew via `crewId`

---

## 2. EMPLOYEES (Active Worker List)

### Source: `data.employeeWeeks: EmployeeWeek[]` + `data.crews: CrewSummary[]`

```typescript
interface EmployeeWeek {
  id: string;
  employeeId: string;
  employeeName: string;                    // ← Full name for display
  workerType: WorkerType;                  // "employee" | "contractor_1099"
  crewId: string;                          // ← Crew assignment
  crewName: string;                        // ← Crew name
  hourlyRate: number | null;               // ← Pay rate
  status: TimesheetStatus;                 // "draft" | "needs_revision" | ...
  entries: DayEntry[];                     // ← Individual day entries
  weeklyTotalHours: number;
  overtimeHours: number;
  grossPay: number;
  confirmedDays: number;
  missingConfirmationDays: number;
  // ... more fields
}
```

**For Team Management Panel:**
- ✅ `employeeWeek.employeeId` — unique identifier
- ✅ `employeeWeek.employeeName` — display name
- ✅ `employeeWeek.hourlyRate` — pay rate (can be null!)
- ✅ `employeeWeek.crewName` — crew assignment
- ✅ `employeeWeek.status` — "draft" = incomplete timesheet

**For Alert Banner (Missing Time):**
- ✅ `employeeWeek.entries` — array of DayEntry objects
- ✅ `employeeWeek.entries[].totalHours` — hours per day
- ✅ `employeeWeek.entries[].dayIndex` — 0=Monday, 1=Tuesday, etc.
- ❌ Currently no "active/inactive" field — need to infer from recent activity or add flag

**For Payroll Export:**
- ✅ `employeeWeek.employeeName`
- ✅ `employeeWeek.weeklyTotalHours` → "Regular Hours"
- ✅ `employeeWeek.overtimeHours`
- ✅ `employeeWeek.grossPay` → "Gross Total"
- ✅ `employeeWeek.status` → "Status"

---

## 3. NEW EMPLOYEE INPUT (For Add Employee Form)

```typescript
interface EmployeeInput {
  firstName: string;
  lastName: string;
  displayName: string;
  workerType: "employee" | "contractor_1099";
  hourlyRate: number;
  defaultCrewId?: string | null;
  active: boolean;
}
```

**Form Fields Needed:**
- ✅ `displayName` — matches form's "Full Name" input
- ✅ `hourlyRate` — matches rate slider (range: $15-$100)
- ✅ `defaultCrewId` — matches crew dropdown
- ✅ `workerType` — could default to "employee" or expose as radio/select
- ✅ `firstName` + `lastName` — derive from displayName or ask separately
- ✅ `active` — default to true on creation

**Note:** Current form has displayName, but API expects firstName/lastName separately. Options:
1. Split "John Smith" → firstName="John", lastName="Smith"
2. Use displayName for both and leave firstName/lastName blank
3. Add separate first/last name fields to form

---

## 4. MISSING TIME DETECTION LOGIC

### Current Implementation Issue:
My alert checks `status === "draft"` (incomplete submission)

### Better Implementation (per discussion):
Check for **missing hours on workdays (Mon-Fri with 0 hours)**

```typescript
const missingTimeAlerts = useMemo(() => {
  return data.employeeWeeks.filter(week => {
    // Check if any workday (Mon=0 to Fri=4) has 0 hours
    return week.entries.some(day => {
      const isWorkday = day.dayIndex < 5; // Mon-Fri
      const hasMissingTime = (day.totalHours || 0) === 0;
      return isWorkday && hasMissingTime;
    });
  }).length;
}, [data.employeeWeeks]);
```

**DayEntry structure:**
```typescript
interface DayEntry {
  id: string;
  dayIndex: number;      // 0=Mon, 1=Tue, ..., 6=Sun
  dayLabel: string;      // "Monday", "Tuesday", etc.
  date: string;          // ISO date
  totalHours: number;    // Hours worked
  // ... more fields
}
```

---

## 5. DATA GAPS & UNKNOWNS

### What's Missing:
1. **ManagedEmployee** interface (used by TeamManagementPanel props) shows different structure:
   ```typescript
   interface ManagedEmployee {
     id: string;
     firstName: string;
     lastName: string;
     displayName: string;
     workerType: WorkerType;
     hourlyRate: number;
     active: boolean;              // ← This would indicate active/inactive
     defaultCrewId: string | null;
     defaultCrewName: string | null;
     hasLoginAccess: boolean;
   }
   ```
   
   **Question:** Is this the actual employee list table, or is EmployeeWeek the source of truth?

2. **No "inactive" flag on EmployeeWeek** — how do we show active vs inactive employees?
   - Option A: If they haven't submitted a timesheet recently, mark as inactive
   - Option B: Add an `active: boolean` field to EmployeeWeek
   - Option C: Use ManagedEmployee list instead (but when/how is it loaded?)

3. **ArchivedEmployee** interface shows archived workers, but no way to "soft delete" from active list yet

---

## 6. COMPONENT-TO-DATA MAPPING

### TeamManagementPanel
```typescript
// Needs:
employees: ManagedEmployee[] | EmployeeWeek[]
crews: CrewSummary[]

// Displays per employee:
- Avatar initials (first letter of name)
- Name (displayName or firstName+lastName)
- Role (workerType)
- Crew assignment (crewName or defaultCrewName)
- Hourly rate (hourlyRate)
- Active status (active boolean or inferred)
- Edit button
```

### AddEmployeeModal
```typescript
// Inputs:
- displayName: string (or firstName + lastName)
- hourlyRate: number ($15-$100 from slider)
- defaultCrewId: string (from crews dropdown)
- workerType: "employee" | "contractor_1099" (optional/default)
- active: boolean (default true)

// Dependencies:
crews: CrewSummary[] (for dropdown)

// Returns:
EmployeeInput (call onCreateEmployee)
```

### Alert Banner (Missing Time)
```typescript
// Logic:
employeeWeeks.filter(week => {
  return week.entries.some(day => 
    day.dayIndex < 5 && (day.totalHours || 0) === 0
  )
})

// Display:
- Count of affected employees
- Quick Fix button scrolls to first problem
```

### Payroll Export Modal
```typescript
// Calculations:
const stats = useMemo(() => ({
  totalEmployees: data.employeeWeeks.length,
  totalGross: data.employeeWeeks.reduce((sum, w) => sum + w.grossPay, 0)
}), [data.employeeWeeks])

// CSV Columns:
["Employee Name", "Regular Hours", "Overtime", "Gross Total", "Status"]

// CSV Rows:
employeeWeeks.map(w => [
  w.employeeName,
  w.weeklyTotalHours,
  w.overtimeHours,
  `$${w.grossPay.toFixed(2)}`,
  w.status
])
```

---

## 7. RECOMMENDED NEXT STEPS

### Before Building Components:
1. ✅ Confirm: Is `data.employeeWeeks` the source of truth for active employees?
2. ⚠️ Clarify: Where does `ManagedEmployee[]` come from? (Is there a separate API call?)
3. ⚠️ Decide: How to indicate active vs inactive? (Add field, or infer?)
4. ⚠️ Decide: Split name or use displayName only in form?

### Once Data Structure is Confirmed:
1. Build TeamManagementPanel (read-only list view)
2. Build AddEmployeeModal (form with dropdown + slider)
3. Implement missing time alert (filter logic)
4. Build payroll export (modal + CSV)
5. Add quick fix navigation + bulk reminders (optional)

