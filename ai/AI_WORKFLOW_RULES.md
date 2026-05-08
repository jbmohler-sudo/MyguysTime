# AI Workflow Rules

Use these rules when helping with this codebase.

## Default Behavior

Work like a careful senior developer.

Before changing code:
1. Understand the current behavior.
2. Identify the smallest safe change.
3. Preserve existing working behavior.
4. Add or update tests when logic, permissions, calculations, persistence, or generation behavior changes.
5. Explain what changed and how it was verified.

Do not rewrite large areas unless clearly necessary.

---

# When to Use Full Careful Mode

Use full careful mode for:

## Powerlifting App
- Program generator logic
- Progression rules
- Exercise substitution rules
- Fatigue/adaptation logic
- Acceptance harness changes
- Snapshot/benchmark changes
- Supabase persistence
- Run history or feedback storage
- Anything affecting deterministic output

## CrewTime App
- Auth/login/session behavior
- Employee/foreman/admin permissions
- Timesheet status workflow
- Office lock/reopen behavior
- Payroll-prep math
- Weekly adjustments
- Exports
- Printable summaries
- Mobile truck mode vs office mode behavior

Full careful mode means:
1. Inspect relevant files first.
2. State the current behavior.
3. Make a short plan.
4. Add or update tests where appropriate.
5. Implement the smallest safe fix.
6. Run tests/build/typecheck when available.
7. Summarize exact files changed.

---

# When NOT to Use Full Careful Mode

For small changes, move fast.

Examples:
- Text changes
- Button labels
- Simple styling
- Minor layout tweaks
- Copy cleanup
- Small one-file UI improvements

For these, do the direct edit and briefly summarize.

---

# Non-Negotiables

## Do Not Break Existing Behavior

If something already works, preserve it unless the task explicitly asks to change it.

## Do Not Invent Business Rules

Ask or clearly flag uncertainty when dealing with:
- payroll
- taxes
- permits
- employment rules
- legal/compliance language
- strength program safety claims

## Determinism Matters

For the powerlifting app:
- Same input should produce same output.
- Generator changes must be explainable.
- Do not silently change acceptance snapshots.
- If snapshots change, explain why.

## Workflow Integrity Matters

For CrewTime:
- Employees should not perform office/admin actions.
- Foremen should only manage allowed crew/team actions.
- Office-locked weeks should stay locked unless reopened by admin.
- Reopen actions require an audit note.
- Payroll-prep is an estimate, not full payroll.

---

# Verification Expectations

Before saying a task is done, run the strongest reasonable checks available:

Preferred order:
1. targeted tests
2. full test suite
3. typecheck
4. build
5. manual verification notes

If a check cannot be run, say so clearly.

Do not claim something was tested if it was not tested.

---

# Response Format

At the end of each task, report:

## Changed
- Files changed
- What was changed

## Verified
- Tests/build/typecheck run
- Any failures or skipped checks

## Notes
- Risks
- Follow-up work, only if important