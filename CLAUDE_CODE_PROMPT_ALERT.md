# Claude Code Prompt: Wire Missing Time Alert Banner into AppShell

## Overview
The `MissingTimeAlertBanner` component is built and ready. Your job is to integrate it into `AppShell.tsx` so it appears on the Dashboard when employees have missing hours on workdays (Mon-Fri with 0 hours).

## Current State
- ✅ `src/components/MissingTimeAlertBanner.tsx` exists (complete, ready to use)
- ⚠️ Banner is NOT imported or rendered in AppShell yet
- ⚠️ No quick fix handler connected

## What the Banner Does

**Shows when:** Employees have 0 hours logged on any workday (Monday-Friday)
**Displays:** Count of affected employees + "ACTION REQUIRED" message
**Button:** "FIX NOW" button that scrolls to the crew board
**Styling:** Orange accent with warning icon
**Visibility:** Only appears in office mode on the dashboard page

---

## What Needs to Happen

### STEP 1: Import the Banner
At the top of `src/components/AppShell.tsx`, add this import:

```typescript
import { MissingTimeAlertBanner } from "./MissingTimeAlertBanner";
```

### STEP 2: Render the Banner in the Dashboard
Find this section in AppShell (around line 320, inside the main content area):

```tsx
{activePage === "dashboard" ? (
  <>
    <WeeklyCrewBoard
      // ... existing props ...
    />
```

Right after the opening `<>` and BEFORE `<WeeklyCrewBoard`, add:

```tsx
{/* Missing Time Alert Banner - Office Mode Only */}
{uiMode === "office" && (
  <MissingTimeAlertBanner
    employeeWeeks={data.employeeWeeks}
    onQuickFix={() => {
      // Scroll to crew board
      const crewBoard = document.querySelector(".weekly-crew-board");
      crewBoard?.scrollIntoView({ behavior: "smooth", block: "start" });
    }}
  />
)}
```

### STEP 3: Position Matters
The banner should appear:
1. AFTER the error banner (if it exists)
2. AFTER the mode banner
3. BEFORE the WeeklyCrewBoard

So in the code flow, it should be:
```tsx
{error ? <div className="error-banner">{error}</div> : null}

<section className={`mode-banner mode-banner--${uiMode}`}>
  {/* mode banner content */}
</section>

<main className="content-grid">
  {activePage === "dashboard" ? (
    <>
      {/* ← ADD ALERT BANNER HERE (only office mode) */}
      {uiMode === "office" && (
        <MissingTimeAlertBanner {...} />
      )}

      <WeeklyCrewBoard {...} />
```

### STEP 4: Test in Browser
1. Go to Dashboard page in OFFICE mode
2. If there are employees with 0 hours on any workday (Mon-Fri):
   - Banner appears with orange accent
   - Shows count of affected employees
   - "ACTION REQUIRED" text is prominent in orange
   - "FIX NOW" button is visible
3. Click "FIX NOW" button:
   - Should scroll to crew board smoothly
   - Should focus on the board area
4. If ALL employees have hours filled on workdays:
   - Banner should NOT appear (hidden)
5. Switch to TRUCK mode:
   - Banner should disappear (not shown in truck mode)
6. Switch back to OFFICE mode:
   - Banner reappears (if missing time exists)

### STEP 5: Verify Styling
- [ ] Banner has light orange background (rgba(255, 140, 0, 0.1))
- [ ] Banner has orange left border (4px solid)
- [ ] Warning icon (⚠️) appears on the left
- [ ] "ACTION REQUIRED" text is uppercase and orange
- [ ] Count message is readable dark text
- [ ] "FIX NOW" button is orange with hover effect
- [ ] Button lifts up on hover (translateY(-2px))
- [ ] Button shadow expands on hover

---

## Component Props

```typescript
interface MissingTimeAlertBannerProps {
  employeeWeeks: EmployeeWeek[];  // All timesheets for the week
  onQuickFix?: () => void;         // Handler when "FIX NOW" clicked
}
```

**How it works:**
1. Component scans `employeeWeeks` for any workday with 0 hours
2. Counts how many employees are affected
3. Shows/hides the banner based on count
4. Returns null (renders nothing) if no missing time

---

## Testing Checklist

### Visual
- [ ] Banner appears when missing time exists
- [ ] Banner hides when all hours are filled
- [ ] Banner hides in TRUCK mode
- [ ] Banner shows in OFFICE mode
- [ ] Orange accent color matches brand
- [ ] Warning icon is visible
- [ ] Text is readable

### Functionality
- [ ] "FIX NOW" button scrolls to crew board
- [ ] Button has hover effects (lift + shadow)
- [ ] Banner correctly counts employees
- [ ] Singular/plural text works ("1 employee has" vs "2 employees have")
- [ ] No console errors

### Edge Cases
- [ ] Test with 0 missing time entries (banner hidden)
- [ ] Test with 1 employee missing time (singular text)
- [ ] Test with 5+ employees missing time (plural text)
- [ ] Test scrolling on mobile (smooth scroll works)

---

## Expected Result

Banner appears on Dashboard (office mode only) when employees have 0 hours on workdays. Shows count, orange branding, quick fix button. Clicking button scrolls to crew board.

Report back with:
1. Screenshot of Dashboard with alert banner showing
2. Screenshot of alert banner in office mode
3. Confirmation that "FIX NOW" scrolls to crew board
4. Screenshot of Dashboard with banner hidden (no missing time)

---

## Notes

- Banner only shows in OFFICE mode (checked via `uiMode === "office"`)
- Only shows on DASHBOARD page (inside `activePage === "dashboard"` block)
- Uses real employee data from `data.employeeWeeks`
- Detects workdays (Monday-Friday, dayIndex 0-4)
- Detects missing hours (totalHours === 0)
- onQuickFix handler is optional but recommended
- Next phase: Add highlight pulse animation when scrolling to incomplete entries

Good luck! Clean integration of a powerful feature.
