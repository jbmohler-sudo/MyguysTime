# AGENTS.md

## Project Context

This is a **crew timecard and payroll-prep application** for small contractor teams.

Primary workflows:

* Truck (mobile): enter and confirm hours quickly
* Office (desktop): review week, adjust, lock, and export

This is **not**:

* a full payroll/compliance system
* a generic SaaS dashboard
* a project management tool

The product must stay:

* simple
* fast
* practical
* trustworthy

---

## Skills

Use the following skills when relevant:

* crew-app-design
* crew-component-standards

Location:
.agents/skills/

* crew-app-design → SKILL.md
* crew-component-standards → SKILL.md

---

## When to use the crew-app-design skill

ALWAYS use this skill when the task involves:

* UI layout changes
* component design or refactoring
* page structure (Dashboard, Company Settings, etc.)
* navigation changes
* onboarding flow
* mobile (truck mode) experience
* office dashboard experience
* copy shown to users
* adding or removing visible fields
* adjusting workflows (review, approve, lock, export)

If unsure, default to using the skill.

---

## When to use the crew-component-standards skill

ALWAYS use this skill when the task involves:

* creating a new React component
* splitting a large component
* reorganizing files/folders
* deciding whether truck and office modes should share a component
* changing component props
* creating section-level UI blocks
* standardizing repeated UI patterns

If unsure, default to using the skill.

---

## UI/UX Requirements (non-negotiable)

1. **Keep Dashboard focused on action**

   * Weekly review only
   * No deep settings
   * No long explanations

2. **Separate concerns**

   * Company Settings = configuration
   * Dashboard = work
   * Do not mix them

3. **Truck vs Office separation**

   * Truck mode: fast, minimal, mobile-first
   * Office mode: review, adjustments, export
   * Do not leak office features into truck mode

4. **Clarity over density**

   * Fewer elements > more elements
   * Remove anything that does not help the current task

5. **Status must always be obvious**

   * draft
   * employee confirmed
   * foreman approved
   * office locked
   * reopened

6. **No feature creep**

   Do NOT introduce:

   * timers
   * Pomodoro
   * generic productivity features
   * analytics dashboards unless explicitly requested

---

## Implementation Rules

### Before making UI changes

* Identify:

  * who is using this (truck vs office)
  * what action they need to complete

* Prefer:

  * fewer steps
  * larger tap targets
  * vertical flow

---

### When adding UI

* Use existing components if possible
* Maintain consistent spacing and typography
* Keep cards simple and readable
* Avoid adding new visual patterns unless necessary

---

### When modifying UI

* Do not duplicate logic or components
* Do not introduce conflicting layouts
* Preserve current workflows unless explicitly changing them

---

## Component Architecture Rules

* Prefer composition over duplication
* Keep business logic out of presentational components
* Use descriptive PascalCase component names
* Split pages into sections when a block has a clear responsibility
* Keep props explicit and minimal
* Do not create separate truck/office components unless layouts truly diverge
* Reuse status/badge/banner patterns consistently

---

## Copy Guidelines

Use plain, practical language.

Preferred phrases:

* "Review week"
* "Final check estimate"
* "Needs confirmation"
* "Adjusted"
* "Reopened"
* "Estimates only — verify before issuing checks."

Avoid:

* buzzwords
* marketing language
* overly technical or compliance-heavy wording

---

## State / Payroll Handling

* This is **payroll-prep**, not payroll
* Always show estimates clearly
* Never imply guaranteed tax accuracy
* Keep disclaimers present but not intrusive

---

## Design System

Refer to:
docs/design-tokens.md

Use these tokens and rules when creating or modifying UI components.

---

## Testing Requirements

After UI or workflow changes:

* run: npm test
* run: npm run build

Ensure:

* no regression in role permissions
* no regression in state handling
* no regression in lock/reopen flow
* no regression in payroll estimate calculations

---

## What to avoid

Do NOT:

* redesign entire screens without reason
* introduce new navigation layers unnecessarily
* add features not requested
* overcomplicate simple flows
* convert the app into a generic SaaS dashboard

---

## Output Expectations

When making changes:

* explain what changed and why
* keep changes scoped
* preserve simplicity
* follow crew-app-design and component standards guidance

If a request conflicts with these rules, simplify or push back.

---

## Goal

Every change should move the product toward:

* faster time entry
* clearer weekly review
* more confident payroll-prep
* better separation between truck and office workflows
