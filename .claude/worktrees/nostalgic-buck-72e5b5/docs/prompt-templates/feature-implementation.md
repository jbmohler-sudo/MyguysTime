# Feature Implementation Prompt Template

Use this template when asking Codex to implement a feature.

---

## Prompt

Implement the **[FEATURE NAME]**.

### Source of truth

* Use: docs/[relevant-spec].md
* Follow the exact behavior defined in the “[SECTION NAME]” section

### Objective

[1–2 sentences describing the goal in plain language]

---

### Scope (what to build)

* [bullet: specific capability]
* [bullet: specific capability]
* [bullet: specific capability]

---

### Behavior Requirements (must follow exactly)

* [rule: state transitions]
* [rule: permissions by role]
* [rule: data handling]
* [rule: edge cases]

---

### UI Requirements

* [where it appears]
* [what the user sees]
* [badges/status/labels]
* [mobile (truck) vs desktop (office) differences]

---

### Data & Integrity Rules

* [server-side vs client-side rules]
* [timestamps/audit requirements]
* [validation rules]

---

### Constraints (do NOT do)

* Do not add features beyond this scope
* Do not change existing workflows outside this feature
* Do not introduce new dependencies unless required
* Preserve current role permissions and status flow
* Keep UI consistent with design tokens and existing components

---

### Files / Areas likely affected

* [e.g., server/index.ts]
* [e.g., prisma/schema.prisma]
* [e.g., src/components/...]
* [e.g., src/domain/...]
  (Adjust as needed)

---

### Testing & Validation

* Ensure:

  * npm test passes
  * npm run build passes
  * no regression in permissions
  * no regression in status transitions

---

### Output Requirements

After implementation, report:

1. What was implemented
2. Key files changed
3. How the feature works end-to-end
4. Any assumptions made
5. Any risks or edge cases
6. Confirmation that existing workflows were not broken

---

## Example (Filled)

Implement the **Needs Revision workflow and status system**.

### Source of truth

* Use: docs/product-strategy-spec.md
* Section: “Needs Revision Workflow”

### Objective

Allow admins/foremen to send entries back to workers for correction with a clear audit trail.

### Scope

* Add NEEDS_REVISION status
* Allow admin/foreman to flag a day or week
* Unlock worker editing when flagged
* Require audit note when flagging
* Preserve audit history

### Behavior Requirements

* Only admin/foreman can set NEEDS_REVISION
* Worker can edit only when status is NEEDS_REVISION or DRAFT
* Transition from NEEDS_REVISION → employee_confirmed → foreman_approved → office_locked
* Locked weeks cannot be set to NEEDS_REVISION directly

### UI Requirements

* Show “Needs Revision” badge on affected entries
* Highlight affected days/weeks in employee card
* Show audit note in office dashboard
* Keep truck UI minimal but show editable state

### Data & Integrity Rules

* Store audit note with timestamp and userId
* Use server timestamps for status changes
* Preserve previous status history

### Constraints

* Do not add new workflow states beyond NEEDS_REVISION
* Do not modify payroll calculation logic

### Files / Areas likely affected

* prisma/schema.prisma
* server/index.ts
* src/components/EmployeeCard.tsx
* src/components/OfficeDashboard.tsx
* src/domain/models.ts

### Testing & Validation

* npm test
* npm run build
* Verify status transitions and permissions

### Output Requirements

(standard output list)
