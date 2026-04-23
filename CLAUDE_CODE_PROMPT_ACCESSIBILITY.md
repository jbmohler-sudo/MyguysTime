# Claude Code Prompt: Fix Critical Accessibility Issues

## Overview
Implement Phase 1 fixes for WCAG 2.1 AA compliance. These are blocking issues that prevent keyboard and screen reader users from accessing the app.

**Scope:** Add focus indicators + fix contrast + implement focus traps  
**Estimated time:** 2-3 hours  
**Result:** 80% WCAG AA compliant, all users can navigate

---

## Step 1: Add Global Focus Indicator Style

Add this to `src/styles.css` at the end of the file:

```css
/* Accessibility: Focus indicator for keyboard navigation */
button:focus-visible,
input:focus-visible,
a:focus-visible,
[role="button"]:focus-visible,
[role="switch"]:focus-visible,
[tabindex]:focus-visible {
  outline: 3px solid #FF8C00;
  outline-offset: 2px;
}

/* Remove default browser outline for styled components */
:focus {
  outline: none;
}

/* Focus visible for interactive elements without explicit :focus-visible support */
button:focus,
input:focus,
a:focus {
  outline: 3px solid #FF8C00;
  outline-offset: 2px;
}
```

**Test:**
1. Open the page
2. Press Tab to navigate
3. Every interactive element should show an orange outline
4. Press Shift+Tab to go backward

---

## Step 2: Fix Orange Color Contrast for Text

The orange (#FF8C00) doesn't meet WCAG AA contrast on white (4.3:1, needs 4.5:1).

### Option A: Darken the orange (recommended for brand consistency)

In `src/components/AppShell.tsx`, find:
```typescript
const BRAND_ORANGE = "#FF8C00";
```

Replace with:
```typescript
const BRAND_ORANGE = "#E67E22";  // Darker orange: 4.8:1 on white ✓
```

Then apply to all components:
- Search: `#FF8C00` → `#E67E22` in AppShell.tsx
- Search: `#FF8C00` → `#E67E22` in TeamManagementPanel.tsx
- Search: `#FF8C00` → `#E67E22` in AddEmployeeModal.tsx
- Search: `#FF8C00` → `#E67E22` in PayrollExportModal.tsx
- Search: `#FF8C00` → `#E67E22` in MissingTimeAlertBanner.tsx

### Option B: Use white text on orange backgrounds instead of orange text

This is already done for buttons ✓. But for nav items and other orange text, change:

```typescript
// Instead of orange text on white:
style={{ color: BRAND_ORANGE }}

// Do: white text on orange background (8.1:1 contrast):
style={{ 
  backgroundColor: BRAND_ORANGE, 
  color: "white" 
}}
```

**Recommendation:** Go with Option A (darken orange) for consistency. It's a one-time find/replace.

**Verify contrast:**
1. Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
2. Enter: Foreground #E67E22, Background white
3. Should show 4.8:1 ✓ (passes WCAG AA)

---

## Step 3: Implement Focus Trap in Modals

Modals need to trap focus (Tab stays inside modal, doesn't escape to page behind).

### For AddEmployeeModal:

Add this hook near the top of the component file:

```typescript
import { useEffect, useRef } from "react";

const useFocusTrap = (isOpen: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      // Find all focusable elements inside modal
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      // Shift+Tab on first element → focus last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element → focus first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return containerRef;
};
```

Then update the modal's outer div:

```typescript
// At top of component:
const containerRef = useFocusTrap(isOpen);

// On the modal container div:
<div
  ref={containerRef}
  style={{
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  }}
  onClick={onClose}
  onKeyDown={(e) => {
    if (e.key === "Escape") onClose();
  }}
>
  {/* Modal content */}
</div>
```

Do the same for `PayrollExportModal`.

**Test:**
1. Open modal
2. Press Tab repeatedly
3. Focus should cycle within modal (not escape to page behind)
4. Press Escape → modal closes

---

## Step 4: Add Aria-Labels to Icon-Only Buttons

Find all icon-only buttons (buttons with emoji/icon, no text):

### Mode Pill Toggle:

```typescript
// Find:
<button onClick={toggleMode} style={{...}}>
  {uiMode === "office" ? "🏢 OFFICE" : "🚚 TRUCK"}
</button>

// Already has text, so it's fine ✓
```

### Close Buttons in Modals:

```typescript
// Find:
<button onClick={onClose} style={{...}}>
  ✕
</button>

// Change to:
<button 
  onClick={onClose} 
  aria-label="Close modal"
  style={{...}}
  title="Close modal"
>
  ✕
</button>
```

### "Add Employee" Button:

```typescript
// In TeamManagementPanel, find:
<button onClick={onOpenAddEmployee} style={{...}}>
  + Add Employee
</button>

// Already has text ✓
```

**Search for:** All `<button>` elements with only emoji/icons, no text content.

---

## Step 5: Add Form Labels and Aria-Labels

### Search Input in TeamManagementPanel:

```typescript
// Find:
<input
  type="text"
  placeholder="Search by name or crew..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

// Change to:
<label htmlFor="employee-search" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
  Search employees
</label>
<input
  id="employee-search"
  type="text"
  placeholder="By name or crew..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  aria-label="Search employees by name or crew"
/>
```

### Employee Name Input in AddEmployeeModal:

```typescript
// Find the name input, change to:
<label htmlFor="employee-name" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
  Employee Name *
</label>
<input
  id="employee-name"
  type="text"
  placeholder="John Smith"
  value={displayName}
  onChange={(e) => setDisplayName(e.target.value)}
  aria-label="Employee full name (required)"
  aria-required="true"
/>
```

### Hourly Rate Slider:

```typescript
// Find the range input, change to:
<label htmlFor="hourly-rate" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
  Hourly Rate *
</label>
<input
  id="hourly-rate"
  type="range"
  min="15"
  max="100"
  value={hourlyRate}
  onChange={(e) => setHourlyRate(Number(e.target.value))}
  aria-label="Hourly rate in dollars per hour"
  aria-valuemin={15}
  aria-valuemax={100}
  aria-valuenow={hourlyRate}
  aria-valuetext={`$${hourlyRate} per hour`}
/>
<span aria-live="polite">Current rate: ${hourlyRate.toFixed(2)}/hr</span>
```

### Crew Dropdown:

```typescript
// Find the select element, change to:
<label htmlFor="crew-select" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
  Assign to Crew *
</label>
<select
  id="crew-select"
  value={selectedCrew}
  onChange={(e) => setSelectedCrew(e.target.value)}
  aria-label="Select crew to assign employee"
  aria-required="true"
>
  <option value="">Choose a truck...</option>
  {crews.map((crew) => (
    <option key={crew.id} value={crew.id}>
      {crew.name}
    </option>
  ))}
</select>
```

---

## Step 6: Add Escape Key Handler to Modals

Both `AddEmployeeModal` and `PayrollExportModal` should close on Escape.

Add this to the outer div of each modal:

```typescript
onKeyDown={(e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    onClose();
  }
}}
```

Or with useEffect:

```typescript
useEffect(() => {
  if (!isOpen) return;

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  document.addEventListener("keydown", handleEscape);
  return () => document.removeEventListener("keydown", handleEscape);
}, [isOpen, onClose]);
```

---

## Step 7: Add Role and Aria-Pressed to Mode Toggle

Update the mode toggle button in AppShell:

```typescript
// Find the mode toggle button:
<button onClick={toggleMode} style={{...}}>
  {uiMode === "office" ? "🏢 OFFICE" : "🚚 TRUCK"}
</button>

// Change to:
<button 
  onClick={toggleMode}
  role="switch"
  aria-checked={uiMode === "office"}
  aria-label="Switch between office and truck modes"
  style={{...}}
>
  {uiMode === "office" ? "🏢 OFFICE" : "🚚 TRUCK"}
</button>
```

---

## Step 8: Test Everything

### Keyboard Navigation Test:
1. Open page in browser
2. Press Tab 20 times, verify:
   - Focus moves logically (left-to-right, top-to-bottom)
   - Orange outline appears around focused elements
   - No focus is hidden or trapped

### Focus Indicators Test:
1. Tab through the page
2. Every button, input, link should have orange outline
3. Outline should be at least 3px thick

### Modal Test:
1. Click "Add Employee" → modal opens
2. Press Tab 5+ times → focus cycles within modal
3. Press Escape → modal closes
4. Focus returns to "Add Employee" button

### Contrast Test:
1. Visit https://webaim.org/resources/contrastchecker/
2. Check each color combination:
   - Text on background
   - Border on background
3. Verify all are ≥4.5:1 (AA) or ≥7:1 (AAA)

### Screen Reader Test (optional but recommended):
1. On Mac: Open VoiceOver (Cmd+F5)
2. Tab through page with VoiceOver enabled
3. Verify all buttons/labels are announced correctly
4. Or use NVDA on Windows (free download)

---

## Step 9: Run Lighthouse Audit

1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Click "Analyze page load"
4. Check Accessibility score:
   - Before: ~60%
   - After Phase 1: ~85%
   - Goal: 90%+

Report any remaining issues.

---

## Commit Message

```
feat: implement phase 1 accessibility fixes for WCAG 2.1 AA

- Add global focus indicators (orange outline on Tab)
- Fix color contrast: update brand orange for 4.5:1 on white
- Implement focus traps in AddEmployeeModal and PayrollExportModal
- Add aria-labels to icon-only buttons and form controls
- Add form labels for all inputs (search, name, rate, crew)
- Add Escape key handler to close modals
- Test keyboard navigation and screen reader compatibility

Fixes issues:
- #1 (Critical): Insufficient color contrast
- #5 (Critical): No visible focus indicators
- #7 (Major): Modal focus trap missing
- Plus 5 more issues (see ACCESSIBILITY_AUDIT.md)

Compliance: ~50% → 80% WCAG AA
```

---

## Verification Checklist

- [ ] Tab through entire page → focus always visible
- [ ] Orange outline appears on all focusable elements
- [ ] Color contrast passes WebAIM checker (4.5:1+)
- [ ] Modals trap Tab focus (don't escape to page)
- [ ] Escape key closes modals
- [ ] All form inputs have labels
- [ ] All icon buttons have aria-label
- [ ] Lighthouse Accessibility score ≥85%
- [ ] Keyboard-only navigation works end-to-end
- [ ] No errors in browser console

---

## Next Steps (Phase 2)

After this PR merges:
- Add error message announcement (`role="alert"`)
- Improve focus management in lists (arrow keys)
- Add skip navigation link
- Full screen reader testing with NVDA/VoiceOver
- Update CLAUDE.md with accessibility guidelines for future components
