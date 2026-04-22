# Bug Fix & Debug Prompt Template

Use this template when diagnosing and fixing bugs.

---

## Prompt

Fix the following bug:

### Problem Description

[Clear, simple description of what is wrong]

Example:

* “Locked weeks are still editable by employees”
* “Homepage flashes login screen before rendering”
* “Adjustments are not reflected in payroll estimate”

---

### Expected Behavior

[What should happen instead]

Example:

* Locked weeks should reject edits
* Homepage should render immediately without flicker
* Payroll estimate should update after adjustments

---

### Actual Behavior

[What is happening now]

---

### Steps to Reproduce

1. [step]
2. [step]
3. [step]

---

### Scope

* Fix the issue only
* Do not introduce new features
* Do not change unrelated logic

---

### Source of Truth

If relevant, follow:

* docs/product-strategy-spec.md
* docs/homepage-spec.md
* docs/design-tokens.md

---

### Investigation Tasks

1. Identify root cause (not just symptoms)
2. Trace data flow (UI → API → DB → UI)
3. Check:

   * role permissions
   * status transitions
   * host routing (if applicable)
   * client vs server logic
4. Confirm whether bug is:

   * frontend
   * backend
   * state management
   * deployment/config issue

---

### Fix Requirements

* Implement minimal, targeted fix
* Preserve existing workflows
* Maintain role-based permissions
* Do not break status system
* Follow existing component structure and design tokens

---

### Files / Areas likely affected

* [list likely files]

---

### Validation

After fixing:

* npm test passes
* npm run build passes
* bug no longer reproducible
* no regression in:

  * permissions
  * status transitions
  * payroll calculations
  * host routing (if relevant)

---

### Output Requirements

Report:

1. Root cause
2. What was changed
3. Files modified
4. Why the fix works
5. Any edge cases to watch
6. Confirmation no regressions introduced

---

## Example (Filled)

Fix the following bug:

### Problem Description

Homepage briefly shows login screen before rendering public homepage.

### Expected Behavior

Homepage should render immediately on [www.myguystime.com](http://www.myguystime.com) without showing login UI.

### Actual Behavior

Login screen flashes briefly before homepage loads.

### Steps to Reproduce

1. Open [www.myguystime.com](http://www.myguystime.com)
2. Observe initial render
3. Login UI appears briefly before homepage

### Source of Truth

* host.ts logic for public vs app hosts

### Investigation Tasks

* Check initial React render logic
* Verify host detection timing
* Inspect conditional rendering in App.tsx
* Confirm no default state renders login before host check

### Fix Requirements

* Ensure host detection runs before initial render
* Prevent login component from rendering on public hosts
* Keep app behavior unchanged for app.myguystime.com

### Files likely affected

* src/App.tsx
* src/utils/host.ts

### Validation

* homepage loads cleanly
* no flash
* app host still works

### Output Requirements

(standard list)
