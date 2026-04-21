# Crew Timecard MVP

A clean MVP scaffold for a crew timecard and payroll-prep web app for small contractors.

## Recommended MVP Architecture

### Tech stack

- Frontend: React 18 + TypeScript + Vite
- Backend: Express + TypeScript
- Styling: plain CSS with design tokens and card-based layout
- Database: hosted PostgreSQL
- ORM/runtime data access: Prisma Client
- Auth: email/password with JWT role claims
- Export layer: CSV generation plus printable HTML summary

### Why this stack

- React + Vite keeps the UI fast and simple for field crews and office review.
- Express keeps the API thin and focused on permission enforcement plus export handoff.
- Hosted Postgres keeps the deployed API compatible with Vercel serverless runtime.
- TypeScript helps protect payroll-prep and timekeeping logic.
- Prisma keeps the schema explicit and portable across local and hosted environments.

### Database environment setup

- Production uses hosted Neon Postgres through `DATABASE_URL`.
- The Vercel Neon integration in this project also provides prefixed `NEON_*` variables.
- For local Prisma work, pull Vercel envs and map `DATABASE_URL` to `NEON_POSTGRES_PRISMA_URL` before running `prisma db push`, `prisma generate`, or `npm run db:seed`.
- SQLite is no longer part of the supported runtime path for this app.

## Product Architecture

The MVP is split into five core domains:

1. Workforce
- employees
- crews
- crew assignments
- archive and rehire history

2. Timekeeping
- one weekly timesheet per employee per workweek
- seven daily entries per timesheet
- crew default daily time templates
- employee confirmation state

3. Payroll Prep
- regular hours
- overtime hours
- gross pay
- withholding estimates
- reimbursements
- deductions and advances
- manual overrides

4. Office Notes
- private employee reports
- office-only visibility
- follow-up tracking

5. Export and Review
- weekly payroll summary export
- weekly time detail export
- printable weekly summary

### Data flow

1. Admin creates crews, employees, pay settings, and assignments.
2. Foreman sets or applies daily crew defaults for the selected week.
3. Employees confirm or adjust only their own daily entries.
4. The weekly review layer computes totals and payroll-prep estimates.
5. Office reviews totals, adjustments, and private reports, then exports weekly handoff files.

## Role-Based Permissions

### Admin / Office

- full read and write across crews, employees, time, adjustments, exports, and reports
- can set pay rates and withholding settings
- can archive and rehire employees
- can see all private reports

### Foreman / Crew Chief

- can read and edit time only for assigned crews
- can view hourly rates for assigned crews
- can create private office-only reports
- cannot export company-wide payroll unless explicitly granted later
- cannot archive employees or change pay settings

### Employee

- can read only their own profile, weekly timesheets, and confirmation status
- can edit only their own time entries before lock/submission
- cannot view pay rates for other employees
- cannot view private reports
- cannot access office dashboards or exports

## Screen Map

### 1. Sign In
- role-aware landing
- minimal entry point for office, foreman, and employee

### 2. Weekly Crew Board
- week picker
- crew selector
- employee cards
- seven-day row for each worker
- crew-level apply-times controls

### 3. Employee Self-Review
- personal weekly card
- confirm or adjust hours
- add job tag
- view weekly totals and status

### 4. Office Weekly Dashboard
- all employees for selected week
- totals, gross pay, withholding estimates, adjustments, net estimate
- export buttons

### 5. Employee Profile
- identity and crew assignment
- pay settings
- archive status
- weekly history summary

### 6. Archive / Rehire Queue
- archived employees
- archive reason
- notes
- rehire action

### 7. Private Reports
- foreman submission form
- office report list and follow-up status

## Schema Overview

The canonical starter schema is in [prisma/schema.prisma](C:\MVP\prisma\schema.prisma).

Key model decisions:

- `Employee` is never deleted. Status is tracked via `employmentStatus`.
- `CrewAssignment` is historical so reassignment stays explainable.
- `TimesheetWeek` holds one employee-week rollup.
- `TimeEntryDay` holds one day of detail for the week.
- `CrewDayDefault` stores week/day crew start and end defaults.
- `WeeklyAdjustment` is separated from worked time.
- `PayrollEstimate` stores the prep calculation output and overrides.
- `PrivateReport` is isolated for office-only visibility.

## Component Architecture

### App shell
- `src/App.tsx`
- `src/main.tsx`

### Backend API
- `server/index.ts`
- `server/auth.ts`
- `server/payroll.ts`
- `server/utils.ts`

### Domain models and frontend logic
- `src/domain/models.ts`
- `src/domain/permissions.ts`
- `src/domain/format.ts`

### API client
- `src/lib/api.ts`

### UI components
- `src/components/AppShell.tsx`
- `src/components/LoginScreen.tsx`
- `src/components/StatCard.tsx`
- `src/components/EmployeeCard.tsx`
- `src/components/WeeklyCrewBoard.tsx`
- `src/components/OfficeDashboard.tsx`
- `src/components/PrivateReportsPanel.tsx`
- `src/components/ArchivePanel.tsx`

## Phased Implementation Plan

### Phase 1
- auth and role-aware app shell
- crew board with employee cards
- seven-day time entry workflow
- payroll-prep calculation engine
- weekly office dashboard
- CSV and printable export scaffolding

### Phase 2
- expand reporting and audit depth after the hosted Postgres rollout is stable
- richer adjustment editing
- archive and rehire flow
- private reports workflow refinement
- audit-oriented change history

### Phase 3
- stronger approval and unlock workflows
- richer withholding profiles
- QuickBooks-friendly export mapping
- deployment hardening

## Validation Status

This repository started empty. The current implementation includes:

- product architecture documentation
- Prisma-backed schema and seed scripts for hosted Postgres
- Prisma-backed API and auth flow
- React/Vite app shell wired to live API data
- typed payroll-prep domain models
- live weekly board and office views

Validation after scaffolding is documented in the final report.

## Sentry rollout

Sentry is wired for both the React frontend and the Express backend, but it stays off until you set DSNs.

### Environment variables

Backend:

- `SENTRY_DSN` - required to send backend errors
- `SENTRY_ENVIRONMENT` - optional environment label such as `production` or `preview`
- `SENTRY_RELEASE` - optional release identifier for backend events
- `SENTRY_TRACES_SAMPLE_RATE` - optional trace sample rate between `0` and `1`; leave blank to keep backend tracing off
- `SENTRY_VERIFY_ENABLED` - temporary flag for the backend verification route; default `false`

Frontend:

- `VITE_SENTRY_DSN` - required to send frontend errors
- `VITE_SENTRY_ENVIRONMENT` - optional environment label shown on frontend events
- `VITE_SENTRY_RELEASE` - optional release identifier for frontend events
- `VITE_SENTRY_TRACES_SAMPLE_RATE` - optional trace sample rate between `0` and `1`; leave blank to keep frontend tracing off
- `VITE_SENTRY_VERIFY_ENABLED` - temporary flag that shows the frontend verification action in office mode; default `false`
- `VITE_SENTRY_BACKEND_VERIFY_ENABLED` - temporary flag that shows the backend verification action in office mode; default `false`

### Default behavior

- Error reporting is disabled until `SENTRY_DSN` and `VITE_SENTRY_DSN` are set.
- Tracing is disabled until the matching `*_TRACES_SAMPLE_RATE` value is set.
- Verification-only UI and API hooks stay disabled until the matching `*_VERIFY_ENABLED` flags are set to `true`.
- The backend verification route is admin-only and returns `404` when verification is disabled.

### How to turn on tracing

1. Set `SENTRY_TRACES_SAMPLE_RATE` for the Express server.
2. Set `VITE_SENTRY_TRACES_SAMPLE_RATE` for the React app.
3. Start with a low value such as `0.05` or `0.1` in production.
4. Rebuild the frontend after changing Vite env vars so the browser bundle picks them up.

### How to verify event delivery

1. Set real DSNs for backend and frontend.
2. Temporarily set `SENTRY_VERIFY_ENABLED=true`.
3. Temporarily set `VITE_SENTRY_VERIFY_ENABLED=true` for the frontend button and `VITE_SENTRY_BACKEND_VERIFY_ENABLED=true` for the backend button.
4. Sign in as an admin and open the office dashboard.
5. Use `Send frontend test event` and `Send backend test event`.
6. Confirm the events appear in Sentry, then set all verification flags back to `false`.

### Verification complete checklist

1. Set `SENTRY_DSN` and `VITE_SENTRY_DSN`.
2. Enable `SENTRY_VERIFY_ENABLED`, `VITE_SENTRY_VERIFY_ENABLED`, and `VITE_SENTRY_BACKEND_VERIFY_ENABLED`.
3. Deploy the app.
4. Trigger the frontend test event from the admin office dashboard.
5. Trigger the backend test event from the admin office dashboard.
6. Confirm both events appear in Sentry.
7. Disable all verification flags again and redeploy.

### Follow-up plan

- Release tagging: set `SENTRY_RELEASE` and `VITE_SENTRY_RELEASE` from the deploy commit SHA or version tag so frontend and backend events land under the same release.
- Source maps: add Vite source map generation plus authenticated upload during CI/CD so frontend stack traces resolve to source.
- Sampling defaults: keep tracing blank during rollout, then move to explicit low production values after traffic review, with separate frontend and backend rates if needed.
