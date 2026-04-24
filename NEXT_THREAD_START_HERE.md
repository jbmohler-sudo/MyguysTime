# Next Thread Start Here

Last updated: 2026-04-24
Repo path: `C:\MyGuys_App`

## What this project is

My Guys Time is a crew timecard and payroll-prep app for small contractor teams.

Core product split:
- Truck mode: fast current-week time entry on phone
- Office mode: weekly review, lock/reopen, exports, archive, and office-only reporting

This repo is the real active project path now. Do not use `C:\MVP` for new work on this app.

## Real hosts

- Marketing/public site: `https://www.myguystime.com`
- App host: `https://app.myguystime.com`

## Current stack

- Frontend: React 18 + TypeScript + Vite
- Backend: Express + TypeScript
- ORM: Prisma
- Database: Postgres (Neon-backed runtime)
- Auth/session: JWT for real login, plus local preview-role mode for fast phone testing
- Monitoring: Sentry
- Hosting: Vercel

## Current app entry flow

The app no longer depends on the old `/demo/*` routes for normal phone testing.

Current entry behavior:
- Public host shows `PublicHomepage`
- App host shows `LoginPage`
- `LoginPage` supports:
  - `Continue as Admin`
  - `Continue as Foreman`
  - `Continue as Employee`
  - seeded email/password login
  - `Create admin account`

Preview-role mode is stored in `localStorage` via `PreviewUserContext` and loads the same shared `AppShell` / `WeeklyCrewBoard` / `EmployeeCard` components used by the real app shell.

## Key files to read first

1. `C:\MyGuys_App\AGENTS.md`
2. `C:\MyGuys_App\docs\project-knowledge-base.md`
3. `C:\MyGuys_App\src\App.tsx`
4. `C:\MyGuys_App\src\pages\LoginPage.tsx`
5. `C:\MyGuys_App\src\context\PreviewUserContext.tsx`
6. `C:\MyGuys_App\src\components\AppShell.tsx`
7. `C:\MyGuys_App\src\components\WeeklyCrewBoard.tsx`
8. `C:\MyGuys_App\src\components\EmployeeCard.tsx`
9. `C:\MyGuys_App\src\styles.css`
10. `C:\MyGuys_App\server\index.ts`
11. `C:\MyGuys_App\prisma\schema.prisma`

## Current mobile UX direction

Recent work was focused on making the phone/truck experience feel like a real app instead of a shrunk desktop page.

Important current decisions:
- Foreman mobile uses an employee switcher row at the top instead of stacking all employees vertically
- The day-entry form is unified across roles
- The mobile day-entry card uses the compact admin-style field order for all roles
- Role differences should mainly affect permissions and bottom actions, not the entire card layout
- The active truck day uses an orange `#FF8C00` treatment
- Favicon/app icon/header logo assets were recently replaced with the new My Guys Time branding files

## Current role/preview behavior

Preview mode is implemented through `PreviewUserContext` and is read by `AppShell` and `EmployeeCard`.

Current intended behavior:
- One single app entry point
- Switch roles from inside the app using the in-app role switcher
- Keep the same shared card layout while changing role perspective

## Important recent fixes

### 1. Scroll jitter / bounce fix

A top-of-page scroll jitter loop was traced to mount-time auto-scroll behavior in `EmployeeCard.tsx`.

What changed:
- removed the truck-mode `focus()` + `scrollIntoView({ behavior: "smooth" })` on the "today" card
- removed leftover horizontal `scroll-snap-*` rules from the old truck day-card strip styles

Status:
- source verified
- `npm run build` passed after the fix
- on-device retest still recommended after deploy

### 2. Single-card truck day editor

Truck mode no longer renders a horizontally overlapping strip of full day editors.
It now shows one active day form at a time.

### 3. Employee switcher for foreman mobile

Foreman truck mode now uses a horizontal employee selector so the page does not become an extremely long scroll when many employees are present.

### 4. Shared role-testing entry

`LoginPage.tsx` now provides magic preview buttons for Admin / Foreman / Employee using the real shared shell instead of relying entirely on `/demo/*`.

## Branding assets now in use

Header/app/browser assets were updated to these files:
- `C:\MyGuys_App\src\assets\logo-full.png`
- `C:\MyGuys_App\public\icons\favicon-16x16.png`
- `C:\MyGuys_App\public\icons\favicon-32x32.png`
- `C:\MyGuys_App\public\icons\icon-64x64.png`
- `C:\MyGuys_App\public\icons\icon-128x128.png`
- `C:\MyGuys_App\public\icons\icon-192.png`
- `C:\MyGuys_App\public\icons\icon-512.png`
- `C:\MyGuys_App\public\icons\apple-touch-icon.png`

## Validation commands

Use these first when making targeted changes:
- `npm run build`
- `npm test` (can still be more environment-sensitive than build)

For the most recent scroll-jitter fix:
- `npm run build` passed

## Current worktree state

As of this handoff:
- `git status --short` was clean in `C:\MyGuys_App`

## Known caveats

- Browser and PWA icons can stay cached aggressively after branding changes
- Phone behavior can still differ from desktop responsive mode, so visual mobile fixes should be checked on-device when possible
- `docs/project-knowledge-base.md` is useful, but it is older than this handoff for some mobile/auth details
- `AGENT_SYNC.md` is stale and should not be treated as the main source of truth

## Best new-thread prompt

Paste something like this into a new conversation:

```text
Use project path C:\MyGuys_App.
Read C:\MyGuys_App\NEXT_THREAD_START_HERE.md first, then inspect the current code before editing.
We are working on the My Guys Time crew timecard/payroll-prep app, especially the mobile truck experience.
Preserve the current shared AppShell / WeeklyCrewBoard / EmployeeCard architecture and make minimal targeted changes.
After changes, run relevant validation and report what is verified vs unverified.
```