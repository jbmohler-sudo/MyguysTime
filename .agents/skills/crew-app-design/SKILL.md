---

name: crew-app-design
description: Use when designing, revising, or reviewing UI/UX for this crew timecard and payroll-prep app. Apply for page layout, component structure, navigation, onboarding, mobile truck mode, office mode, dashboard clarity, settings pages, and feature prioritization. Do not use for backend-only work unless the task affects user-facing workflow or product structure.
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Crew App Design Skill

This product is a **simple crew timecard and payroll-prep tool for small contractors**.

It is built for two environments:

* **Truck mode**: foreman and employees entering or confirming hours quickly on mobile
* **Office mode**: admin/office reviewing weekly time, adjustments, estimates, and exports on desktop

The design goal is **clarity, speed, and trust**, not feature density.

## Core product truths

Always design around these truths:

1. This is **not** a general SaaS dashboard.
2. This is **not** a full payroll system.
3. This is **not** a project management app.
4. This is a **weekly work review and payroll-prep workflow**.
5. The user must be able to understand what to do next without training.
6. The UI must feel practical for contractors and office staff, not trendy or over-designed.

## Primary users

### 1. Foreman / Crew Chief

Needs:

* fast access on phone
* current week only by default
* clear Today anchor
* quick start/end/confirm actions
* minimal clutter

### 2. Employee

Needs:

* simple self-review
* edit only own time when allowed
* obvious read-only states
* no office-only complexity

### 3. Office / Admin

Needs:

* scan the whole week quickly
* see missing confirmations
* review adjustments
* understand check estimate
* export with confidence
* access company/state/payroll-prep settings

## Design principles

### 1. Clarity over cleverness

Prefer obvious labels, visible states, and straightforward layout.
Do not rely on hidden interactions or subtle magic.

### 2. Action-first screens

Every screen should answer:

* What is this page for?
* What does the user need to do next?
* What is missing or blocked?

### 3. Simplicity beats feature density

Do not add controls, cards, stats, badges, or helper text unless they clearly reduce confusion.

### 4. Workflow over decoration

Design should support:

* enter hours
* review week
* adjust payroll-prep inputs
* lock/reopen
* export

### 5. Trustworthy visuals

This app handles pay-related estimates.
Use calm, readable UI.
Avoid flashy design, heavy gradients, unnecessary animation, or startup-style gimmicks.

## Layout rules

### Dashboard

The dashboard should be a **working screen**, not a marketing page.

Keep:

* week context
* role/mode context
* employee cards or weekly review rows
* next-step guidance
* relevant actions

Move out of the dashboard:

* deep company settings
* long explanations
* setup-only content
* rarely used controls

### Company Settings

Company profile and payroll-prep defaults belong on a separate page.

Include here:

* company identity
* company state
* payroll-prep defaults
* support summary
* disclaimer acknowledgement
* state support explanation

Do not mix these into the weekly review surface.

### Navigation

Use simple navigation.

Preferred top-level structure:

* Dashboard
* Company Settings
* Archive
* Sign out

For mobile:

* hamburger menu

For desktop:

* simple top nav or compact sidebar

Do not create deep navigation trees.

## Truck mode rules

Truck mode is mobile-first and must feel fast.

### Truck mode should:

* default to the current week
* clearly highlight Today
* focus on day cards
* support quick Start day / End day / Confirm day actions
* keep tap targets large
* minimize text and administrative detail

### Truck mode should not show:

* payroll estimate details
* company support summaries
* export controls
* archive/history tools
* repeated disclaimer text
* office-only reporting surfaces

### Truck mode design preference

Prefer vertical flow, strong date anchoring, and self-contained day cards.

## Office mode rules

Office mode is desktop-first and supports review and control.

### Office mode should prioritize:

* scanability
* missing confirmations
* adjustment visibility
* final check estimate
* support level visibility when relevant
* export confidence

### Office mode should show:

* grouped payroll-prep summary blocks
* clear state/status badges
* restrained reminders
* lock/reopen state clarity
* audit context where needed

### Office mode should not feel like:

* an analytics product
* a reporting warehouse
* a generic HR suite

## Card and component rules

### Employee day cards

Must include:

* full date
* Today marker when relevant
* start time
* end time
* lunch
* job tag
* daily total

Behavior:

* +/- buttons adjust the active selected field
* active field must be visually obvious
* read-only state must be obvious when locked or unavailable

### Employee weekly summaries

Should surface:

* total hours
* adjustments if relevant
* final check estimate in office mode
* clear next action

### Support summary blocks

Should explain:

* support level
* what calculations are supported
* what requires manual review
* source and last reviewed info when available

Tone should be calm and practical, not alarming.

## Onboarding rules

Onboarding should be step-based and simple.

Preferred flow:

1. Company name and state
2. Payroll-prep defaults
3. Disclaimer acknowledgement
4. Initial crew/employees
5. Go to dashboard

Do not overwhelm setup with too many options.
Do not mix onboarding with weekly operations once setup is complete.

## Copy and tone rules

Use plain language.
Write for real people, not software buyers.

Prefer:

* "Review week"
* "Final check estimate"
* "Needs confirmation"
* "Reopened"
* "Adjusted"
* "Estimates only — verify before issuing checks."

Avoid:

* jargon
* compliance-heavy phrasing unless necessary
* feature-marketing language
* generic SaaS buzzwords

## Visual style rules

Use:

* clean spacing
* strong hierarchy
* readable typography
* subtle color cues for status
* clear active states
* obvious section separation

Avoid:

* clutter
* overuse of badges
* giant feature grids
* noisy gradients
* decorative charts unless they truly help

## Status and workflow presentation

Always make these states clear:

* draft
* employee confirmed
* foreman approved
* office locked
* reopened

The UI should never leave the user wondering whether a week is editable, final, or pending review.

## What to optimize for

When proposing or revising UI, optimize for:

1. speed of entering hours
2. speed of scanning the week
3. confidence in estimated numbers
4. separation between setup and operations
5. mobile usability in the truck
6. desktop usability in the office

## What not to optimize for

Do not optimize for:

* showing off features
* abstract dashboards
* trendy SaaS visuals
* animation-heavy interactions
* broad “works for everyone” positioning

## Review checklist

Before suggesting a UI change, check:

* Does this reduce confusion?
* Does this help truck users move faster?
* Does this help office users review faster?
* Is this information on the right page?
* Is this too much for one screen?
* Does this look like a tool for contractors and office staff?
* Is the app still simple?

If the answer is no, simplify.
