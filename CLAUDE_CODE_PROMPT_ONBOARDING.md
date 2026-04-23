# Claude Code Prompt: Onboarding Integration

## Context
The onboarding infrastructure (useOnboarding, useAnalytics, OnboardingOverlay) is ready for integration into AppShell. This walkthrough guides new users through key features on first launch and persists state to localStorage.

## Integration Checklist

### Step 1: Add OnboardingProvider Wrapper
Wrap the main AppShell content in OnboardingProvider so useOnboardingContext is available throughout the component tree.

**Location:** `src/App.tsx` or `src/main.tsx` (wherever AppShell is rendered)
**Action:** Import OnboardingProvider from `src/hooks/useOnboarding` and wrap `<AppShell />` inside it:
```tsx
<OnboardingProvider>
  <AppShell data={bootstrapPayload} />
</OnboardingProvider>
```

### Step 2: Render OnboardingOverlay
Inside AppShell, render the OnboardingOverlay component. It will appear as a backdrop + highlight box over the target element specified in the current onboarding step.

**Location:** `src/components/AppShell.tsx` (end of component, before closing div)
**Action:** Import OnboardingOverlay and add below main content:
```tsx
import { OnboardingOverlay } from './OnboardingOverlay';

// Inside AppShell render:
<OnboardingOverlay />
```

### Step 3: Add Help Link to Navigation
Create a "Help" or "?" icon in the top navigation bar that restarts the onboarding tour.

**Location:** `src/components/AppNav.tsx`
**Action:** 
- Import `useOnboardingContext` from `src/hooks/useOnboarding`
- Add a button or link in the nav header:
```tsx
const { restartTour } = useOnboardingContext();

<button 
  className="app-nav__help-button"
  onClick={() => restartTour()}
  aria-label="Restart guided tour"
  title="Start the guided tour again"
>
  ?
</button>
```

### Step 4: Wire Analytics Tracking
Add `trackEvent()` calls to existing user actions so onboarding completion data is captured.

**Locations:**
- **AddEmployeeModal.tsx** → After successful employee creation:
```tsx
const { trackFeatureUsage } = useAnalytics();
trackFeatureUsage('employee_created', { crewName, hourlyRate });
```

- **PayrollExportModal.tsx** → After successful export:
```tsx
const { trackFeatureUsage } = useAnalytics();
trackFeatureUsage('payroll_exported', { weekCount: data.employeeWeeks.length });
```

- **MissingTimeAlertBanner.tsx** → On alert interaction:
```tsx
const { trackEvent } = useAnalytics();
trackEvent('alert_viewed', { alertType: 'missing_time' });
```

### Step 5: Add Onboarding Completion Logic
After user completes the onboarding steps, hide the overlay and optionally show a completion message.

**Location:** `src/components/OnboardingOverlay.tsx` (already implemented)
**Status:** ✅ Done — component checks `isActive` and renders nothing when tour is complete. Final step shows "Done" button.

### Step 6: Test Onboarding Flow
1. **Fresh Install:** Clear localStorage, reload the app. Overlay should appear on home hero section.
2. **Navigation:** Click "Next" button. Overlay should highlight the next target element in sequence.
3. **Persistence:** Complete step 3, reload page. Progress should persist (step 4 active).
4. **Restart:** Click "Help" link in nav. Tour should restart from step 1.
5. **Skip:** Click "Skip tour" button. Onboarding should disappear and not reappear (unless Help link clicked).

### Step 7: Verify Analytics
1. Open browser DevTools → Console.
2. Watch for `[Analytics]` log messages as you interact with the app.
3. Confirm events are logged for: step views, step completions, feature usage (employee creation, export, etc.).
4. Check localStorage key `myguystime_onboarding_v1` contains step progress JSON.

## Files to Modify
- `src/App.tsx` or `src/main.tsx` — Add OnboardingProvider wrapper
- `src/components/AppShell.tsx` — Import and render OnboardingOverlay
- `src/components/AppNav.tsx` — Add Help button with restartTour() call
- `src/components/AddEmployeeModal.tsx` — Add trackFeatureUsage() on submit
- `src/components/PayrollExportModal.tsx` — Add trackFeatureUsage() on export
- `src/components/MissingTimeAlertBanner.tsx` — Add trackEvent() on alert view (optional)

## New Files Created (Ready to Use)
- `src/hooks/useOnboarding.ts` ✅
- `src/hooks/useAnalytics.ts` ✅
- `src/components/OnboardingOverlay.tsx` ✅

## Success Criteria
- ✅ App loads with onboarding overlay visible on hero section (step 1)
- ✅ Clicking "Next" progresses through 7 steps
- ✅ Overlay highlights correct target elements (selector matches DOM)
- ✅ Progress persists across page reloads
- ✅ "Help" link in nav restarts tour
- ✅ Analytics events logged to console in development
- ✅ All links remain functional during walkthrough (overlay doesn't block interaction)

## Notes
- OnboardingOverlay uses `z-index: 1000` to appear above all content.
- Highlight box is 3px orange border (`3px solid var(--color-primary-orange)`) matching brand.
- Steps auto-complete when user interacts with target elements (e.g., opening AddEmployeeModal auto-completes step 3).
- Analytics events are buffered and logged immediately in development. In production, batch them to your analytics service endpoint.
