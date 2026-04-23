# Claude Code Prompt: Wire Add Employee Modal into AppShell

## Overview
The `AddEmployeeModal` component is built and ready. Your job is to integrate it into `AppShell.tsx` so it opens when users click "ADD NEW GUY" on the Team page.

## Current State
- ✅ `src/components/AddEmployeeModal.tsx` exists (complete, ready to use)
- ✅ `AppShell.tsx` has `showAddEmployeeModal` state defined
- ⚠️ Modal is NOT imported or rendered in AppShell yet
- ⚠️ No handler connected to `onOpenAddEmployee` callback
- ⚠️ No `onSave` handler defined for form submission

## What Needs to Happen

### STEP 1: Import the Modal
At the top of `src/components/AppShell.tsx`, add this import:

```typescript
import { AddEmployeeModal } from "./AddEmployeeModal";
```

### STEP 2: Render the Modal in AppShell
Find this line in AppShell (around line 70-80 where useState calls are):
```typescript
const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
```

After the closing `</main>` tag (at the very end of the return statement, around line 350+), add:

```tsx
{/* Add Employee Modal */}
<AddEmployeeModal
  isOpen={showAddEmployeeModal}
  crews={data.crews}
  onClose={() => setShowAddEmployeeModal(false)}
  onSave={async (employee) => {
    // For now, just log it and close the modal
    console.log("New employee data:", employee);
    setShowAddEmployeeModal(false);
    // TODO: Call onCreateEmployee(employee) handler here when backend is ready
  }}
/>
```

### STEP 3: Update the TeamManagementPanel callback
Find this line (around line 280 where TeamManagementPanel is rendered):
```tsx
onOpenAddEmployee={() => setShowAddEmployeeModal(true)}
```

This should already be there from the last redesign. If it's not, add it.

### STEP 4: Test in Browser
1. Navigate to the "Team" page
2. Click "ADD NEW GUY" button
3. Modal should appear with:
   - Orange top border
   - Title "New Crew Member"
   - Full Name input field
   - Crew Selection dropdown (populated from data.crews)
   - Hourly Rate slider ($15-$100)
   - Cancel and Save buttons
4. Test the slider — verify the large orange number updates
5. Test the dropdown — verify all crews appear
6. Click Cancel — modal should close
7. Click Save (with form filled) — should log employee data to console
8. Open DevTools console to see the logged data

### STEP 5: Verify Form Validation
1. Click Save with empty name — should show error "Please enter a full name"
2. Click Save with no crew selected — should show error "Please select a crew"
3. Fill all fields — should log data and close modal

---

## Key Details

### Modal Props
```typescript
interface AddEmployeeModalProps {
  isOpen: boolean;                    // Controls visibility
  crews: CrewSummary[];               // Dropdown options (from data.crews)
  onClose: () => void;                // Called when user clicks Cancel or clicks outside
  onSave: (employee: {                // Called when user clicks Save
    displayName: string;              // Full name from input
    hourlyRate: number;               // Value from slider
    defaultCrewId: string;            // Selected crew ID
  }) => Promise<void>;
}
```

### What the Modal Returns (onSave callback)
```typescript
{
  displayName: "John Smith",
  hourlyRate: 32,
  defaultCrewId: "crew-123"
}
```

---

## Visual Details to Verify

- [ ] Modal overlay is dark (rgba(0,0,0,0.7))
- [ ] Modal card has 8px orange top border
- [ ] Modal has white background and rounded corners
- [ ] Header text is dark and bold ("New Crew Member")
- [ ] Full Name input has 2px border, rounds to orange on focus
- [ ] Crew dropdown shows "Choose a truck..." placeholder
- [ ] Crew dropdown has orange caret (▼) on the right
- [ ] Hourly rate displays large in orange with $ and /hr
- [ ] Slider is gray with orange thumb circle
- [ ] Min/max labels show $15 and $100
- [ ] Cancel button is gray, Save button is orange
- [ ] Buttons have hover effects (Save lifts up + shadow expands)
- [ ] Error messages have orange left border

---

## Testing Checklist

### Visual
- [ ] Modal appears when "ADD NEW GUY" is clicked
- [ ] Modal closes when Cancel is clicked
- [ ] Modal closes when clicking outside (on dark overlay)
- [ ] All form fields are visible and styled correctly
- [ ] Colors match the brand (orange = #FF8C00)

### Functionality
- [ ] Name input accepts text
- [ ] Crew dropdown populates with all crews
- [ ] Rate slider moves from $15-$100
- [ ] Large rate display updates as slider moves
- [ ] Validation errors appear if Save is clicked with empty fields
- [ ] Save button logs employee data to console (check DevTools)
- [ ] Modal closes after successful Save
- [ ] Can open and close modal multiple times

### Edge Cases
- [ ] Try very long names (should fit without breaking layout)
- [ ] Try selecting different crews
- [ ] Verify slider doesn't go below $15 or above $100
- [ ] Check that focus states work on inputs/select/slider

---

## Expected Result

After implementation:
- Modal opens/closes correctly
- Form accepts input without errors
- All styling matches design (orange branding, modern appearance)
- No console errors
- Ready for backend wiring (next phase)

---

## Success Criteria

When done, report back with:
1. Screenshot of the modal open on the Team page
2. Screenshot showing error validation (try clicking Save with empty form)
3. Screenshot of the slider at different values ($15, $50, $100)
4. Confirmation that clicking Save logs data to console
5. Any styling issues or missing visual details

---

## Notes

- The modal is already complete, no new code needed
- Just wiring it into AppShell
- `onSave` handler currently just logs and closes (TODO for later: call backend)
- Modal closes on Cancel or Escape key (handled internally)
- Crew data comes from `data.crews` which is already available in AppShell
- After this integrates, next phase is connecting to `onCreateEmployee` backend handler

Good luck! This should be a clean integration.
