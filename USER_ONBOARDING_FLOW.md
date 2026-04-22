# User Account Creation and Onboarding Flow

## Overview

The current onboarding flow is **admin-only**. When an admin user logs in for the first time, they see the **CompanySetupScreen** to configure their company and bootstrap crew data.

---

## 1. **Authentication & Bootstrap**

### 1.1 Login (`src/components/LoginScreen.tsx`)
- Users enter email + password
- **Endpoint**: `POST /api/auth/login`
- Returns JWT token containing:
  - `userId`
  - `role` (ADMIN, FOREMAN, EMPLOYEE)
  - `companyId` (scoped to company in Phase 2)

### 1.2 Bootstrap (`src/lib/api.ts:52-55`, `server/index.ts:~450`)
- After login, `fetchBootstrap()` is called with the JWT token
- **Endpoint**: `GET /api/auth/me`
- Returns `BootstrapPayload` containing:
  - Company settings (name, state, defaults)
  - User role and permissions
  - Current week's timesheets
  - **Key field**: `setupComplete` boolean

---

## 2. **Onboarding Route Decision** (`src/App.tsx:251-270`)

The app checks the bootstrap payload and makes a routing decision:

```typescript
if (isAdmin && !setupComplete) {
  // Show CompanySetupScreen
} else {
  // Show AppShell (main app)
}
```

**Important**: Non-admin users (FOREMAN, EMPLOYEE) skip onboarding entirely and go straight to AppShell.

---

## 3. **CompanySetupScreen** (`src/components/CompanySetupScreen.tsx`)

A **4-step wizard** that collects company configuration:

### Step 1: **Company Setup**
- Company name (required)
- Owner name (optional)

### Step 2: **Crew Setup**
- Add crew members by name (required: at least one)
- Optional: Hourly rate per person
- Worker type: W2 or 1099 per person

### Step 3: **Time Tracking Style** (Choose one)
- **Foreman enters time** — One person (foreman) logs all hours
- **Workers enter their own** — Each employee self-reports
- **Mixed** — Foreman-led but workers can update

### Step 4: **Payroll Preferences**
- Lunch deduction: None, 30, or 60 minutes
- Pay type: Hourly vs. Hourly + Overtime
- Track expenses: Yes/No

### Form Flow
- Validation enforces required fields at each step
- "Back" button available (except step 1)
- Final button: "Open weekly board" → calls `completeCompanySetup()`

---

## 4. **Complete Company Setup Endpoint** (`server/index.ts:888-1039`)

### Permission Check
- Only ADMIN role can complete setup
- Blocks non-admins with 403 Forbidden

### Validation
- Company name: Required, non-empty
- Time tracking style: Must be FOREMAN, WORKER_SELF_ENTRY, or MIXED
- Lunch deduction: Must be 0, 30, or 60
- Pay type: Must be HOURLY or HOURLY_OVERTIME
- Employees: At least one required; valid hourly rates (non-negative)

### Database Operations (in order)

1. **Update Company** — Set:
   - `companyName`
   - `ownerName`
   - `onboardingCompletedAt` (timestamp)
   - `onboardingCompletedByUserId` (tracks who completed)

2. **Update CompanyPayrollSettings** — Set defaults:
   - `timeTrackingStyle`
   - `defaultLunchMinutes`
   - `payType`
   - `trackExpenses`

3. **Create Default Crew** — "Main Crew" for all employees

4. **Create Employees** — For each person added in Step 2:
   - Parse display name into firstName/lastName
   - Set workerType (EMPLOYEE for W2, CONTRACTOR_1099 for 1099)
   - Calculate `hourlyRateCents` from input
   - Default withholding rates (W2 uses company defaults, 1099 = 0)
   - Link to default crew

5. **Ensure Week Data** — Bootstrap timesheets for current week

6. **Recalculate Timesheets** — For all employees with company defaults

7. **Return Bootstrap** — Fresh payload with `setupComplete=true`

---

## 5. **Current State in Your App**

### What Exists
- ✅ Login for any user (admin/foreman/employee)
- ✅ Bootstrap fetch with setup status
- ✅ CompanySetupScreen (admin-only wizard)
- ✅ completeCompanySetup endpoint (creates default crew + initial employees)
- ✅ Multi-company data isolation (companyId in JWT, query-scoped)

### What's Missing for Full User Management
- ❌ **User account creation** (currently: seeded demo accounts only)
- ❌ **Employee account invitations** (invite foreman/employee users)
- ❌ **Employee login setup** (foreman/employee users created without credentials)
- ❌ **Add employees after onboarding** (currently: only during CompanySetupScreen)
- ❌ **User management UI** (create, invite, deactivate users)

---

## 6. **Phase 3 Implications**

To implement true user account creation and employee invitations, you'll need:

1. **Signup endpoint** — Allow users to create accounts (self-register or via invite link)
2. **Invite flow** — Admin invites employees/foremen via email
3. **Employee creation decoupled from user accounts** — Currently tied together in CompanySetupScreen
4. **Post-onboarding employee management** — Add/remove employees after initial setup
5. **Account deactivation** — Deactivate users while keeping employee records

---

## 7. **Current Seeded Test Accounts**

### Crew Time Masonry & Roofing (MA)
- **Admin**: admin@crewtime.local / admin123
- **Foreman**: luis@crewtime.local / foreman123
- **Employee**: marco@crewtime.local / employee123

### ApexRoofing, Inc (TX)
- **Admin**: admin@apexroofing.local / apex_admin123
- **Foreman**: jake@apexroofing.local / apex_foreman123
- **Employee**: sarah@apexroofing.local / apex_employee123

These are hardcoded in `prisma/seed.ts` and created on database reset.
