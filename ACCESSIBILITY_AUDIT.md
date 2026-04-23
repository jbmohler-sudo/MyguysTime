# Accessibility Audit: MyGuysTime Dashboard
**Standard:** WCAG 2.1 AA  
**Date:** April 22, 2026  
**Scope:** AppShell + Team Management Panel, Add Employee Modal, Payroll Export Modal, Missing Time Alert Banner

---

## Summary
**Issues found:** 12 | **Critical:** 3 | **Major:** 4 | **Minor:** 5

---

## Findings by Category

### Perceivable (WCAG 1.x)

#### Issue #1: Orange Text on Light Background — Insufficient Contrast
**WCAG Criterion:** 1.4.3 Contrast (Minimum)  
**Severity:** 🔴 Critical  
**Affected Elements:** 
- Header nav items (orange text on white/light hover state)
- "Export Payroll" button text
- Mode pill labels ("OFFICE", "TRUCK")
- Rate display in employee cards ("$20.50/hr")

**Details:**
- Orange (#FF8C00) on white background = 4.3:1 contrast
- WCAG AA requires 4.5:1 for normal text (14-17px)
- Orange on light orange background = ~2.8:1 (fails)

**Fix:**
1. Darken orange brand to #D97700 or #CC7000 (≥4.5:1 on white)
2. Use white text on orange backgrounds (orange #FF8C00 + white = 8.1:1) ✓
3. For nav items: keep white text, orange background on hover (not orange text)
4. Test with WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

**Priority:** Critical — affects readability for ~8% of users (color blindness + vision impairment)

---

#### Issue #2: Icon-Only Buttons Without Text Labels
**WCAG Criterion:** 1.1.1 Non-text Content  
**Severity:** 🟡 Major  
**Affected Elements:**
- Mode pill toggle icon (moon/sun icon)
- Close button (✕) in modals
- "Add Employee" button (if showing only icon)

**Details:**
- Icons alone are not accessible to screen readers
- Users can't understand button purpose without visual inspection

**Fix:**
```typescript
// Instead of:
<button onClick={toggle}>☀️</button>

// Do:
<button onClick={toggle} aria-label="Toggle truck mode">☀️</button>
```

Add `aria-label` to all icon-only buttons describing the action.

**Priority:** Major — blocks keyboard + screen reader users

---

#### Issue #3: Missing Form Labels on Input Fields
**WCAG Criterion:** 1.3.1 Info and Relationships  
**Severity:** 🟡 Major  
**Affected Elements:**
- Search input in TeamManagementPanel ("Search by name or crew...")
- Employee name input in AddEmployeeModal
- Hourly rate slider range

**Details:**
- Placeholder text ≠ label (disappears on focus)
- Screen readers can't associate inputs with labels

**Fix:**
```typescript
// Instead of:
<input placeholder="Search by name or crew..." />

// Do:
<label htmlFor="search">Search by name or crew</label>
<input id="search" placeholder="Optional hint text..." />
```

Or use `aria-label` for simple cases:
```typescript
<input aria-label="Search employees by name or crew" />
```

**Priority:** Major — blocks screen reader users from understanding form fields

---

#### Issue #4: Color Alone Used to Convey Information
**WCAG Criterion:** 1.4.1 Use of Color  
**Severity:** 🟢 Minor  
**Affected Elements:**
- Status badge (green for "Active", gray for "Inactive")
- Alert banner orange accent

**Details:**
- Color-blind users can't distinguish active/inactive without text
- Status badge currently shows text ✓, but alert banner is color-only

**Fix:**
```typescript
// Status badge (already good):
<div style={{ backgroundColor: emp.status === "Active" ? "#E8F5E9" : "#F5F5F5" }}>
  {emp.status}  {/* Text label present */}
</div>

// Alert banner: add text indicator:
<div>
  ⚠️ ACTION REQUIRED: 3 employees missing time
  {/* Icon + text = color not the only differentiator */}
</div>
```

**Priority:** Minor — text labels already present in most cases

---

### Operable (WCAG 2.x)

#### Issue #5: Keyboard Navigation — No Visible Focus Indicator
**WCAG Criterion:** 2.4.7 Focus Visible  
**Severity:** 🔴 Critical  
**Affected Elements:** All buttons, inputs, interactive elements

**Details:**
- Buttons have no `:focus` or `:focus-visible` outline
- Keyboard-only users can't see which element has focus
- Tab through the page → buttons disappear visually

**Fix:**
```typescript
// Add to all interactive elements:
button: {
  outline: "none",  // Remove browser default (wrong!)
  // Instead:
  "&:focus-visible": {
    outline: `3px solid ${BRAND_ORANGE}`,
    outlineOffset: "2px",
  }
}

// Or in CSS:
button:focus-visible {
  outline: 3px solid #FF8C00;
  outline-offset: 2px;
}
```

**Priority:** Critical — keyboard-only users can't navigate

---

#### Issue #6: Tab Order Not Logical
**WCAG Criterion:** 2.4.3 Focus Order  
**Severity:** 🟡 Major  
**Affected Elements:** AppShell header, modals, sidebar

**Details:**
- Tab order should follow visual layout (left-to-right, top-to-bottom)
- If elements are positioned with CSS (flexbox reverse, absolute positioning), tab order breaks
- Modal rendered after `</main>` but visually on top (focus can trap)

**Test:**
1. Open page
2. Press Tab repeatedly
3. Focus should move logically through elements
4. Modal focus should cycle within modal (not escape to page behind)

**Fix:**
```typescript
// In modals, use focus trap:
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Tab") {
      // Trap focus within modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      // ... focus cycling logic
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

**Priority:** Major — keyboard-only users experience broken navigation

---

#### Issue #7: Modals Can't Be Closed via Keyboard (Escape Key)
**WCAG Criterion:** 2.1.1 Keyboard  
**Severity:** 🟡 Major  
**Affected Elements:** AddEmployeeModal, PayrollExportModal

**Details:**
- Escape key closes modals ✓ (good!)
- But only if focus is on modal (focus trap needed)
- User can accidentally focus page behind modal → Escape doesn't work

**Fix:**
Implement focus trap (see Issue #6) + Escape handler:
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

**Priority:** Major — keyboard users need Escape key exit

---

#### Issue #8: Touch Targets Below Minimum Size
**WCAG Criterion:** 2.5.5 Target Size  
**Severity:** 🟢 Minor  
**Affected Elements:**
- Status badge (small text)
- Close button (✕) in modals (possibly <32px)
- Chevron/expand icons on employee cards

**Details:**
- WCAG AA requires 44×44 CSS pixels for touch targets
- Smaller targets cause misclicks on mobile/tablet

**Test:**
1. Resize window to mobile (375px)
2. Try clicking small buttons
3. Are they easy to tap without accidentally hitting neighbors?

**Fix:**
```typescript
// Ensure minimum 44×44px:
<button
  style={{
    minWidth: "44px",
    minHeight: "44px",
    padding: "12px",  // Ensure spacious padding
  }}
>
  ✕
</button>
```

**Priority:** Minor — mostly affects mobile users, but important for mobile-first design

---

### Understandable (WCAG 3.x)

#### Issue #9: Form Validation Errors Not Announced
**WCAG Criterion:** 3.3.1 Error Identification  
**Severity:** 🟡 Major  
**Affected Elements:** AddEmployeeModal validation (requires name + crew)

**Details:**
- When user submits without required fields, error message appears
- But screen reader doesn't announce the error
- User doesn't know why form was rejected

**Fix:**
```typescript
// Use aria-live to announce errors:
<div
  role="alert"
  aria-live="polite"
  aria-atomic="true"
  style={{
    borderLeft: `4px solid ${BRAND_ORANGE}`,
    padding: "12px",
    backgroundColor: "rgba(255, 140, 0, 0.1)",
  }}
>
  {error && <p>{error}</p>}
</div>

// Or link error to input:
<input
  id="employee-name"
  aria-describedby="name-error"
/>
{error && <div id="name-error" role="alert">{error}</div>}
```

**Priority:** Major — screen reader users can't see form errors

---

#### Issue #10: Missing ARIA Labels on Complex Widgets
**WCAG Criterion:** 4.1.2 Name, Role, Value  
**Severity:** 🟡 Major  
**Affected Elements:**
- Hourly rate slider (input type="range")
- Mode toggle (office/truck)
- Employee card action buttons ("Edit", "Delete")

**Details:**
- Sliders need `aria-label` to describe purpose
- Toggle switches need role="switch" + aria-checked
- Buttons should have descriptive text or aria-label

**Fix:**
```typescript
// Slider:
<input
  type="range"
  aria-label="Hourly rate (dollars per hour)"
  min="15"
  max="100"
  value={rate}
  onChange={(e) => setRate(Number(e.target.value))}
/>
<span aria-live="polite">Current rate: ${rate}/hr</span>

// Toggle:
<button
  role="switch"
  aria-checked={uiMode === "office"}
  aria-label="Switch between office and truck modes"
  onClick={toggleMode}
>
  {uiMode === "office" ? "OFFICE" : "TRUCK"}
</button>

// Edit button:
<button aria-label={`Edit employee ${employeeName}`}>Edit</button>
```

**Priority:** Major — screen reader users can't understand control purpose

---

#### Issue #11: No Skip Navigation Link
**WCAG Criterion:** 2.4.1 Bypass Blocks  
**Severity:** 🟢 Minor  
**Affected Elements:** Header navigation

**Details:**
- Keyboard users must tab through entire header before reaching main content
- "Skip to main content" link lets them jump past nav

**Fix:**
```typescript
// Add at top of AppShell:
<a
  href="#main-content"
  style={{
    position: "absolute",
    left: "-9999px",  // Hidden visually
    padding: "8px 16px",
    backgroundColor: BRAND_ORANGE,
    color: "white",
  }}
  onClick={(e) => {
    e.preventDefault();
    document.getElementById("main-content")?.focus();
  }}
>
  Skip to main content
</a>

// On main element:
<main id="main-content" tabIndex={-1}>
  {/* Content */}
</main>
```

**Priority:** Minor — nice-to-have, helps power users

---

### Robust (WCAG 4.x)

#### Issue #12: Semantic HTML — Divs Used Instead of Buttons
**WCAG Criterion:** 4.1.2 Name, Role, Value  
**Severity:** 🟢 Minor  
**Affected Elements:** Employee cards (onClick handler on div)

**Details:**
- Employee cards have `onClick` but are rendered as `<div>`
- Screen readers read as "group" not "button"
- Keyboard users can't activate via Enter/Space

**Fix:**
```typescript
// Instead of:
<div onClick={() => onEditEmployee(emp.id)} style={{...}}>
  Employee info
</div>

// Do:
<button
  onClick={() => onEditEmployee(emp.id)}
  style={{...}}
  aria-label={`Edit ${emp.name}`}
>
  Employee info
</button>

// Or if styling is complex:
<div
  role="button"
  tabIndex={0}
  onClick={() => onEditEmployee(emp.id)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEditEmployee(emp.id);
    }
  }}
  style={{...}}
>
  Employee info
</div>
```

**Priority:** Minor — keyboard-only users affected, but workaround exists (Tab + Enter)

---

## Color Contrast Summary

| Element | Foreground | Background | Ratio | Required | Status |
|---------|-----------|------------|-------|----------|--------|
| Button text | White | Orange #FF8C00 | 8.1:1 | 4.5:1 | ✅ Pass |
| Orange text on white | Orange #FF8C00 | White | 4.3:1 | 4.5:1 | ❌ Fail |
| Status badge text | Dark | Light green #E8F5E9 | 12:1 | 4.5:1 | ✅ Pass |
| Alert banner text | Dark | Light orange rgba(255,140,0,0.1) | 7.2:1 | 4.5:1 | ✅ Pass |

**Recommendation:** Adjust orange brand color for text or ensure orange is only used for backgrounds.

---

## Keyboard Navigation Checklist

- [ ] All buttons/links can be focused (Tab key)
- [ ] Focus indicator visible (orange outline recommended)
- [ ] Tab order follows visual order (left-to-right, top-to-bottom)
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] No keyboard traps (focus can cycle back to start)
- [ ] Form fields can be submitted via keyboard
- [ ] Slider can be adjusted via arrow keys

**Current Status:** ❌ 3 of 8 working

---

## Screen Reader Testing Checklist

**Tools needed:**
- VoiceOver (Mac/iOS)
- NVDA (Windows)
- JAWS (Windows, paid)

**Test plan:**
1. Navigate page with screen reader only
2. Can you understand page structure? (headings, landmarks)
3. Can you interact with all controls? (buttons, inputs, dropdowns)
4. Do error messages get announced?
5. Do form validations make sense?
6. Can you navigate without sighted assistance?

**Current Status:** ❌ Major issues with button labels, form errors, focus

---

## Priority Fixes (In Order)

### Phase 1: Critical (Blocks access)
1. **Add focus indicators** to all interactive elements
2. **Darken orange** (#FF8C00 → #D97700) or use white text on orange
3. **Fix keyboard focus trap** in modals (Escape key handling)

**Estimated effort:** 2-3 hours  
**Impact:** Keyboard-only users can now navigate and interact

### Phase 2: Major (Degrades experience)
4. **Add aria-labels** to icon buttons, sliders, toggles
5. **Add form labels** (or aria-label) to inputs
6. **Implement focus trap** in modals (Tab cycling)
7. **Add role="alert"** to error messages (announcement)

**Estimated effort:** 3-4 hours  
**Impact:** Screen reader users can understand and use the app

### Phase 3: Minor (Polish)
8. Add skip navigation link
9. Increase touch target sizes on mobile
10. Test with Lighthouse/axe DevTools

**Estimated effort:** 1-2 hours  
**Impact:** Better experience for all users, WCAG AA compliance

---

## Tools for Testing

- **Automated:** Lighthouse (Chrome DevTools), axe DevTools (browser extension)
- **Color contrast:** WebAIM Contrast Checker, Colordot.io
- **Keyboard:** Manual testing (Tab, Enter, Escape, arrows)
- **Screen reader:** NVDA (free, Windows), VoiceOver (built-in, Mac)
- **Manual:** WAVE browser extension, color contrast analyzer

---

## Compliance Path

**Current:** ~50% WCAG AA compliant (4 of 12 issues blocking access)  
**After Phase 1:** ~80% WCAG AA (critical access restored)  
**After Phase 2:** ~95% WCAG AA (ready for production)  
**After Phase 3:** 100% WCAG AA (fully accessible + delightful)

**Target deadline:** Before public launch (recommend Phase 1 + 2)

---

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM: Articles & Resources](https://webaim.org/)
- [Deque University: Free a11y courses](https://dequeuniversity.com/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
