---

name: crew-component-standards
description: Use when creating, renaming, splitting, or reviewing React components in this crew timecard and payroll-prep app. Apply for component boundaries, file naming, props shape, UI composition, page structure, and shared view logic across truck and office modes.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Crew Component Standards

This file defines how components should be structured for this project.

The goal is to keep the UI:

* readable
* reusable
* mode-aware
* easy to maintain

## Core rules

### 1. Prefer composition over duplication

If truck mode and office mode share behavior, reuse the same component with clear mode-aware props.

Good:

* `EmployeeCard` with `uiMode`
* `WeeklyCrewBoard` with focused subcomponents

Avoid:

* `TruckEmployeeCard`
* `OfficeEmployeeCard`
  unless the experiences truly diverge enough to justify separate files.

### 2. Keep business logic out of presentational components

Presentational components should:

* render state
* fire events
* stay readable

Business logic should live in:

* domain functions
* API layer helpers
* parent containers
* hooks

### 3. Split by responsibility, not by size alone

Create a new component when a block has a distinct purpose.

Examples:

* `SupportSummaryBlock`
* `CompanyIdentitySection`
* `PayrollDefaultsSection`
* `WeeklyStatusBanner`

Do not split a component only because it got long if the pieces are not reusable or conceptually separate.

### 4. Pages orchestrate, sections explain, atoms display

Use this mental model:

* **Page** = whole screen route
* **Section** = meaningful page block
* **Component** = reusable UI unit
* **Row/Card** = repeated data unit
* **Control** = button/input/small behavior

## Recommended folder structure

Use:

```text
src/
  components/
    app/
    navigation/
    dashboard/
    company/
    employee/
    office/
    truck/
    archive/
    shared/
  domain/
  api/
  hooks/
  pages/
```

If current structure is flatter, move gradually. Do not do a massive reorg without reason.

## Naming rules

### Components

Use PascalCase and descriptive names.

Good:

* `CompanySettingsPanel`
* `SupportSummaryBlock`
* `EmployeeCard`
* `WeeklyCrewBoard`
* `OfficeDashboard`
* `QuickActionRow`

Avoid:

* `Card2`
* `InfoBox`
* `ThingPanel`
* `Widget`
* `DataView`

### Props

Use explicit prop names.

Good:

* `uiMode`
* `isLocked`
* `supportLevel`
* `onReapplyDefaults`
* `onConfirmDay`

Avoid:

* `mode`
* `data`
* `info`
* `handleClick` when more specific naming is possible

### Files

One exported component per file unless tightly coupled helper components are truly local.

Good:

* `EmployeeCard.tsx`
* `SupportSummaryBlock.tsx`

## Component boundaries

### Page components

Page-level components should:

* fetch/load data
* connect route context
* compose sections
* avoid deep rendering detail when possible

Examples:

* `DashboardPage`
* `CompanySettingsPage`

### Section components

Section components should represent a meaningful piece of a page.

Examples:

* `CompanyIdentitySection`
* `PayrollDefaultsSection`
* `WeeklyReviewHeader`
* `ExportSummarySection`

### Repeated item components

Use dedicated files for repeated structures.

Examples:

* `EmployeeCard`
* `DayCard`
* `AuditEntryRow`
* `AdjustmentBadge`

## Mode-aware design

Truck and office mode should share structure where possible.

### Prefer this

```tsx
<EmployeeCard uiMode="truck" />
<EmployeeCard uiMode="office" />
```

### Avoid this

Two separate component trees that drift over time.

Create separate components only when:

* layout is fundamentally different
* interaction model is fundamentally different
* shared abstraction becomes harder to read than two files

## Props shape rules

### Keep props small and intentional

Pass:

* only what the component needs
* clear callbacks
* already-shaped view data when possible

Avoid passing giant objects when a component only needs 3 fields.

### Prefer view models for complex UI

If a component needs lots of derived display logic, shape the data before rendering.

Good:

* `supportSummary`
* `weeklyStatusView`
* `employeeCardView`

Avoid dumping raw backend payloads into deep leaf components.

## State rules

### Local component state is for UI state

Examples:

* active field
* expanded/collapsed state
* unsaved edit buffer
* highlight/selection

### Shared/app state is for workflow state

Examples:

* selected week
* current company settings
* payroll estimate data
* role/mode context

Do not hide important workflow state deep inside leaf components.

## Form rules

### Group by user meaning

Do not scatter related controls.

Good:

* company identity fields together
* payroll default fields together
* disclaimer acknowledgement together

### Save behavior

For office/admin forms:

* prefer explicit Save/Cancel when multiple related fields are edited together

For quick truck interactions:

* immediate save is acceptable when low risk and obvious

## Display rules

### Status should be represented consistently

Use dedicated small components or helpers for:

* `StatusBadge`
* `SupportLevelBadge`
* `ReminderBanner`

Do not restyle the same meaning differently on every screen.

### Repeated visual patterns should be standardized

If three screens use the same summary card pattern, create one shared component.

## Do not create these anti-patterns

### 1. Mega-components

Avoid single files that contain:

* data loading
* business logic
* rendering
* form state
* export actions
* nested helper components
  all at once

### 2. One-off visual wrappers everywhere

Avoid excessive wrappers that add little meaning.

### 3. Props tunneling

If props are passed down through many layers, restructure.

### 4. Logic in JSX

Complex conditions or calculations should move above the return block.

## Refactor triggers

Split or refactor when:

* a component has more than one clear responsibility
* the same display pattern appears 3+ times
* truck and office logic become tangled
* status logic is duplicated
* settings forms become hard to scan

## Review checklist

Before creating or changing a component, ask:

* What is this component responsible for?
* Is this a page, section, card, row, or control?
* Does this logic belong here?
* Can truck and office share this?
* Are the props clear and minimal?
* Would another developer understand this file quickly?

If not, simplify.
