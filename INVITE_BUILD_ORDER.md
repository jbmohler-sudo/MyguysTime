# Employee Invitation System - Build Order

## Execution Sequence

Complete in this exact order. Each step builds on the previous one.

---

## Phase 1: Security Foundation & Database

### Step 1: Backend Security & RLS Policies
**Document:** `INVITE_BUTTON_SECURITY_AND_UI.md` → Section 1-2

**What to do:**
1. Create `invites` table in Supabase (use schema from `INVITE_SYSTEM_DESIGN.md`)
2. Add columns to `managed_employees`: `invited_by`, `invited_at`, `invite_status`
3. Enable RLS on `invites` table
4. Create RLS policies:
   - "Only admins can create invites" (INSERT)
   - "View own company invites" (SELECT)
   - "Only admins can update invites" (UPDATE)
   - "Only admins can revoke invites" (DELETE)
   - "Public magic link lookup" (for token verification)

**Why first:**
- Everything else depends on secure database scoping
- RLS prevents unauthorized invites at the database layer
- No frontends can bypass these rules

**Success check:**
- ✅ `invites` table exists with all columns
- ✅ RLS policies enabled (not disabled)
- ✅ `managed_employees` has new columns
- ✅ Test: Try inserting invite with wrong company_id → blocked by RLS

---

## Phase 2: Backend Logic

### Step 2: Edge Functions (API Handlers)
**Document:** `INVITE_BUTTON_SECURITY_AND_UI.md` → Section 2

**What to do:**
1. Create Edge Function: `supabase/functions/invite-crew-member/index.ts`
   - POST `/invite-employee`
   - Validates user role + company_id from JWT
   - Creates invite record
   - Generates magic link via Supabase Auth
   - Sends email with magic link + redirectTo URL

2. Create Edge Function: `supabase/functions/invite-employee-resend/index.ts`
   - POST `/invite-employee/resend`
   - Increments `send_count`, updates `last_sent_at`
   - Resends magic link email

3. Create Edge Function: `supabase/functions/signup-after-invite/index.ts`
   - POST `/signup-after-invite`
   - Verifies magic link token
   - Creates user account + password
   - Updates invite status to 'accepted'
   - Creates `managed_employees` record

**Why second:**
- These handle all invite lifecycle logic server-side
- RLS policies already in place to guard them
- Frontends will call these endpoints

**Success check:**
- ✅ All 3 edge functions deploy successfully
- ✅ Test: Call `/invite-employee` with invalid JWT → 401 error
- ✅ Test: Call with wrong company_id in JWT → RLS blocks insert
- ✅ Test: Call with non-admin role → 403 error

---

## Phase 3: TypeScript Types & Services

### Step 3: Types & Service Layer
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 1-2

**What to do:**
1. Create `src/types/invites.ts`
   - Export: `Invite`, `InviteFormData`, `InviteResponse`, `SignupFormData`

2. Create `src/services/inviteService.ts`
   - `createInvite(formData)` → POST `/invite-employee`
   - `resendInvite(inviteId)` → POST `/invite-employee/resend`
   - `revokeInvite(inviteId)` → DELETE `/invite-employee/:id`
   - `completeSignup(password, phone)` → POST `/signup-after-invite`
   - `getInvitesByCompany()` → GET `/invites`
   - Error handling + retry logic

**Why third:**
- Encapsulates all API calls in one place
- Types ensure type safety across components
- Components just import + use these

**Success check:**
- ✅ TypeScript compiles with zero errors
- ✅ All imports resolve (types + service)
- ✅ Service methods have correct signatures

---

## Phase 4: React Components

### Step 4: Create Reusable Badge Component
**Document:** `RESEND_INVITE_FEATURE.md` → Section 1

**What to do:**
1. Create `src/components/InviteStatusBadge.tsx`
   - Shows: 🟠 "Pending Invite" | ✅ "Active" | ⏱️ "Invite Expired" | 🚫 "Invite Revoked"
   - **Resend button appears ONLY for pending status**
   - Confirmation dialog on click
   - Calls `useInvites.resendInvite()` on confirm
   - Tracks analytics

**Why fourth:**
- Reusable across multiple components
- Used in Team Management + Invite Management Panel
- Handles resend logic inline

**Success check:**
- ✅ Badge renders correct status + icon
- ✅ Resend button hidden for non-pending statuses
- ✅ Confirmation dialog appears on button click
- ✅ Can close dialog without resending
- ✅ Resend succeeds + updates state

---

### Step 5: Create Invite Modal
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 5

**What to do:**
1. Create `src/components/InviteEmployeeModal.tsx`
   - Form: Email (required) + Phone (optional) + Crew (dropdown) + Rate (slider)
   - Role-gated: Only visible if user.role === 'admin'
   - Validation: Email format + hourly rate > 0 + crew selected
   - Submit: Calls `inviteService.createInvite()`
   - Shows loading state + error toast
   - Success: Toast notification + callback to parent

**Why fifth:**
- Depends on `inviteService` (Phase 3)
- Parent component (AppShell) will manage isOpen state
- Should be independent modal component

**Success check:**
- ✅ Form fields validate on input
- ✅ Submit button disabled if form invalid
- ✅ Loading state shows during submit
- ✅ Error toast displays if submission fails
- ✅ Success toast shows invite sent
- ✅ Form resets after success

---

### Step 6: Create Signup After Magic Link Form
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 7

**What to do:**
1. Create `src/components/SignupAfterMagicLink.tsx`
   - Landing page after user clicks email link
   - Extract token from URL query params
   - Fetch invite record + display read-only fields:
     - Email (from invite)
     - Crew (from invite)
     - Rate (from invite)
   - Required fields:
     - Password (with strength validation)
     - Confirm Password
   - Optional: Phone
   - Submit: Calls `inviteService.completeSignup()`
   - On success: Redirect to `/dashboard`

**Why sixth:**
- Depends on `inviteService` (Phase 3)
- Standalone page route
- Magic link sets Supabase session before rendering

**Success check:**
- ✅ Page loads with pre-filled fields from URL
- ✅ Email/crew/rate are read-only
- ✅ Password strength shows real-time feedback
- ✅ Confirm password validation
- ✅ Submit creates account + redirects to dashboard
- ✅ Error handling for expired tokens

---

### Step 7: Create useInvites Hook
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 3 | `RESEND_INVITE_FEATURE.md` → Section 4

**What to do:**
1. Create `src/hooks/useInvites.ts`
   - `fetchInvites()` - GET invites for company
   - `createInvite(formData)` - POST new invite
   - `resendInvite(inviteId)` - POST resend
   - `revokeInvite(inviteId)` - DELETE revoke
   - Returns: `{ invites, loading, error, createInvite, resendInvite, revokeInvite, fetchInvites }`
   - Auto-fetch on mount
   - Optimistic updates for resend

**Why seventh:**
- Encapsulates all invite-related state logic
- Used by: Invite Modal, Invite Management Panel, Badge
- Should fetch invites on mount to populate UI

**Success check:**
- ✅ Hook fetches invites on mount
- ✅ createInvite triggers fetch to refresh list
- ✅ resendInvite updates local state optimistically
- ✅ revokeInvite refreshes list
- ✅ Error states handled

---

### Step 8: Create Invite Management Panel
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 6

**What to do:**
1. Create `src/components/InviteManagementPanel.tsx`
   - Table: Email | Phone | Crew | Rate | Status | Sent Date | Actions
   - Status badges (use InviteStatusBadge component)
   - Filter tabs: All | Pending | Accepted | Expired | Revoked
   - Actions: Resend (pending only) | Revoke (pending only)
   - Empty state: "No invites yet"
   - Uses `useInvites()` hook

**Why eighth:**
- Depends on all previous components (Badge, useInvites hook)
- Showcases invite lifecycle management
- Standalone panel that integrates into AppShell

**Success check:**
- ✅ Table displays all invites
- ✅ Filter tabs work + show correct count
- ✅ InviteStatusBadge renders + resend button visible for pending
- ✅ Resend button calls resendInvite()
- ✅ Revoke button calls revokeInvite()

---

## Phase 5: Integration into App

### Step 9: Update App Router
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 8

**What to do:**
1. Update `src/App.tsx` or `src/main.tsx`
   - Add public route: `/invite-signup` → `<SignupAfterMagicLink />`
   - Route should NOT require auth (magic link sets session before rendering)

**Why ninth:**
- Makes the magic link landing page accessible
- User clicks email → lands on `/invite-signup?token=XXX`

**Success check:**
- ✅ Route accessible without login
- ✅ Can navigate to `/invite-signup` directly
- ✅ Supabase session works on this route

---

### Step 10: Update AppShell Navigation
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 10 | `INVITE_BUTTON_SECURITY_AND_UI.md` → Section 2-3

**What to do:**
1. Update `src/components/AppShell.tsx` or `src/components/AppNav.tsx`
   - Add "Invite Employee" button in Team Management header
   - Button visible ONLY if: `user.role === 'admin' || user.role === 'office_manager'`
   - Clicking opens `InviteEmployeeModal`
   - Modal props: `companyId`, `availableCrews` (from bootstrap payload), `onClose`, `onInviteSent`
   - On invite sent: Show success toast + refresh team management list

**Why tenth:**
- Integrates the Invite button into main app
- Role-gated at component level (security layer 1)
- RLS enforces at database layer (security layer 2)

**Success check:**
- ✅ Button hidden for non-admin users
- ✅ Button visible for admins
- ✅ Clicking opens modal
- ✅ Modal closes on success
- ✅ Team management refreshes after invite sent

---

### Step 11: Update Team Management Panel
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 9 | `INVITE_BUTTON_SECURITY_AND_UI.md` → Section 3 | `RESEND_INVITE_FEATURE.md` → Section 3

**What to do:**
1. Update `src/components/TeamManagementPanel.tsx`
   - Import `InviteStatusBadge` component
   - For each employee in table row:
     - Show `<InviteStatusBadge />` in status column
     - Badge shows: pending → 🟠 with resend button | active → ✅
     - Pass `onResendSuccess` callback to refresh list

**Why eleventh:**
- Displays invite status + resend button next to each employee
- Shows admins exactly who's pending, who's active
- Allows quick resend from employee list

**Success check:**
- ✅ Badge renders correctly for each employee
- ✅ Resend button visible only for pending
- ✅ Clicking resend → confirmation dialog
- ✅ Badge updates after resend success

---

## Phase 6: Styling & Analytics

### Step 12: Add CSS for Badges, Buttons, Dialogs
**Document:** `INVITE_BUTTON_SECURITY_AND_UI.md` → Section 3 | `RESEND_INVITE_FEATURE.md` → Section 2

**What to do:**
1. Update `src/styles.css`
   - Badge styles: `.badge--pending`, `.badge--active`, `.badge--revoked`, `.badge--expired`
   - Pending badge pulse animation
   - Resend button: `.btn--resend` with hover/active/disabled states
   - Confirmation dialog: `.modal--confirm` with overlay + slideUp animation
   - Mobile responsive for all

**Why twelfth:**
- Brings all components to visual life
- Orange branding consistent across badges + buttons
- Animation draws admin attention to pending invites

**Success check:**
- ✅ Badges render with correct colors
- ✅ Pulse animation on pending badge
- ✅ Resend button has hover effects
- ✅ Dialog slides up smoothly
- ✅ Mobile responsive layout

---

### Step 13: Wire Analytics
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Step 12

**What to do:**
1. Add `useAnalytics()` calls throughout:
   - InviteEmployeeModal: `trackEvent('invite_created', { crew_name, hourly_rate })`
   - InviteStatusBadge: `trackEvent('invite_resent', { email })` + `trackEvent('invite_resend_failed', { error })`
   - SignupAfterMagicLink: `trackEvent('signup_started', {})` + `trackEvent('signup_completed', { crew_name })`
   - TeamManagementPanel: Track resend/revoke actions

**Why thirteenth:**
- Measures invite adoption + success rates
- Identifies which invites fail (troubleshooting)
- Helps track user onboarding funnel

**Success check:**
- ✅ Analytics events logged to console (dev mode)
- ✅ Event payloads contain correct fields
- ✅ Production: Events batch + send to analytics service

---

## Final Testing

### Step 14: Complete Testing Checklist
**Document:** `CLAUDE_CODE_PROMPT_INVITES.md` → Testing Checklist

**What to test:**
1. Admin can create invite with email + crew + rate
2. Magic link email sent + verified by Supabase
3. Worker clicks link → lands on signup form
4. Read-only fields pre-filled from invite
5. Worker sets password → account created
6. Invite status changes from pending → active
7. Employee appears in Team Management with ✅ "Active" badge
8. Admin can resend pending invite → confirmation dialog → email resent
9. Admin can revoke invite → status changes to 🚫 "Revoked"
10. 7 days pass → invite auto-marked as ⏱️ "Expired"
11. Company isolation: Masonry A can't see Masonry B's invites
12. Non-admin users can't see "Invite Employee" button
13. TypeScript passes with zero errors
14. Mobile responsive (modal, badge, buttons, dialogs)
15. Analytics events logged correctly

---

## Summary: 14-Step Build Order

| Phase | Step | Component/Feature | Document |
|-------|------|------------------|----------|
| **1** | 1 | RLS Policies + Database Schema | INVITE_BUTTON_SECURITY_AND_UI.md |
| **2** | 2 | Edge Functions (3 endpoints) | INVITE_BUTTON_SECURITY_AND_UI.md |
| **3** | 3 | Types + Service Layer | CLAUDE_CODE_PROMPT_INVITES.md |
| **4** | 4 | InviteStatusBadge + Resend | RESEND_INVITE_FEATURE.md |
| **4** | 5 | InviteEmployeeModal | CLAUDE_CODE_PROMPT_INVITES.md |
| **4** | 6 | SignupAfterMagicLink | CLAUDE_CODE_PROMPT_INVITES.md |
| **4** | 7 | useInvites Hook | CLAUDE_CODE_PROMPT_INVITES.md + RESEND_INVITE_FEATURE.md |
| **4** | 8 | InviteManagementPanel | CLAUDE_CODE_PROMPT_INVITES.md |
| **5** | 9 | App Router | CLAUDE_CODE_PROMPT_INVITES.md |
| **5** | 10 | AppShell Integration | CLAUDE_CODE_PROMPT_INVITES.md + INVITE_BUTTON_SECURITY_AND_UI.md |
| **5** | 11 | TeamManagementPanel Integration | All documents |
| **6** | 12 | CSS Styling | INVITE_BUTTON_SECURITY_AND_UI.md + RESEND_INVITE_FEATURE.md |
| **6** | 13 | Analytics Wiring | CLAUDE_CODE_PROMPT_INVITES.md |
| **6** | 14 | Final Testing | CLAUDE_CODE_PROMPT_INVITES.md |

---

## How to Use This Order with Claude Code

**Run Claude Code 4 times:**

1. **Run 1 (Steps 1-3):** Database + Backend
   - Hand off: `INVITE_BUTTON_SECURITY_AND_UI.md` sections 1-2
   - Outcome: RLS policies + 3 edge functions + types + service layer

2. **Run 2 (Steps 4-8):** React Components
   - Hand off: `CLAUDE_CODE_PROMPT_INVITES.md` + `RESEND_INVITE_FEATURE.md`
   - Outcome: All 4 components (Badge, Modal, Signup, Panel) + useInvites hook

3. **Run 3 (Steps 9-11):** App Integration
   - Hand off: Integration steps from all documents
   - Outcome: Router + AppShell button + Team Management badges

4. **Run 4 (Steps 12-14):** Styling + Testing
   - Hand off: CSS + Analytics + Testing checklist
   - Outcome: Styled components + Analytics wired + All tests pass

---

## Fallback: If You Hand Off All at Once

If you want Claude Code to do everything in one go, use this order within the prompt:
1. Create database schema + RLS
2. Create 3 edge functions
3. Create types + service
4. Create 4 components + hook
5. Update router + AppShell + Team Management
6. Add CSS + analytics
7. Test everything
