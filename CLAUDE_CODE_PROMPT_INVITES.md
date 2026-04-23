# Claude Code Prompt: Employee Invitation System

## Context
This task implements the complete dual-path employee invitation system (email + SMS framework) with magic link flow, pre-assigned crew + rate, company-scoped isolation via RLS, and immediate visibility in Team Management with "Invite Sent" badge.

## Pre-Build Checklist

Before starting, ensure:
1. Supabase project has `invites` table created (see INVITE_SYSTEM_DESIGN.md schema)
2. RLS policies are enabled on `invites` table
3. ManagedEmployee table has new columns: `invited_by`, `invited_at`, `invite_status`
4. Email provider configured in Supabase (Auth → Providers → Email)
5. Edge Functions environment has `SUPABASE_URL` + `SUPABASE_ANON_KEY` available

## Build Steps

### Step 1: Create TypeScript Types
**File:** `src/types/invites.ts`

Define all interfaces:
```typescript
export interface Invite {
  id: string;
  company_id: string;
  created_by: string;
  invitee_email: string;
  invitee_phone?: string;
  crew_name: string;
  hourly_rate: number;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
  accepted_at?: string;
  expires_at: string;
  token?: string;
  last_sent_at?: string;
  send_count: number;
}

export interface InviteFormData {
  invitee_email: string;
  invitee_phone?: string;
  crew_name: string;
  hourly_rate: number;
  send_via: 'email' | 'sms';
}

export interface InviteResponse {
  success: boolean;
  invite_id: string;
  message: string;
  magic_link_sent?: boolean;
  sms_sent?: boolean;
}

export interface SignupFormData {
  password: string;
  confirm_password: string;
  phone?: string;
}
```

### Step 2: Create Invite Service
**File:** `src/services/inviteService.ts`

Functions:
- `createInvite(formData: InviteFormData): Promise<InviteResponse>` — POST to /invite-employee
- `resendInvite(inviteId: string): Promise<InviteResponse>` — POST to /invite-employee/resend
- `revokeInvite(inviteId: string): Promise<InviteResponse>` — DELETE /invite-employee/:id
- `completeSignup(password: string, phone?: string): Promise<{ success: boolean; redirectTo: string }>` — POST to /signup-after-invite
- `getInvitesByStatus(status: 'pending' | 'accepted' | 'expired' | 'revoked'): Promise<Invite[]>` — GET /invites?status=X
- `getInvitesByCompany(): Promise<Invite[]>` — GET /invites (all for user's company)

Error handling:
- Email already invited → throw error with message
- Invalid hourly rate → throw validation error
- Network errors → retry logic with exponential backoff
- Token expired → redirect to login

### Step 3: Create useInvites Hook
**File:** `src/hooks/useInvites.ts`

```typescript
export function useInvites() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inviteService.getInvitesByCompany();
      setInvites(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvite = useCallback(async (formData: InviteFormData) => {
    setLoading(true);
    try {
      const response = await inviteService.createInvite(formData);
      await fetchInvites(); // Refresh list
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvites]);

  const resendInvite = useCallback(async (inviteId: string) => {
    setLoading(true);
    try {
      const response = await inviteService.resendInvite(inviteId);
      await fetchInvites(); // Refresh list
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvites]);

  const revokeInvite = useCallback(async (inviteId: string) => {
    setLoading(true);
    try {
      const response = await inviteService.revokeInvite(inviteId);
      await fetchInvites(); // Refresh list
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInvites]);

  useEffect(() => {
    fetchInvites();
  }, []);

  return { invites, loading, error, createInvite, resendInvite, revokeInvite, fetchInvites };
}
```

### Step 4: Create InviteStatusBadge Component
**File:** `src/components/InviteStatusBadge.tsx`

Small reusable badge showing invite status:
- Props: `status`, `createdAt`, `acceptedAt?`
- Render:
  - Pending: 🟠 "Invite Sent" (orange badge, 2px border)
  - Accepted: ✅ "Active" (green, no badge needed if already logged in)
  - Expired: ⏱️ "Invite Expired" (gray, 2px dashed border)
  - Revoked: 🚫 "Revoked" (red, strikethrough email)

Styling: Use CSS variables for colors (`--color-primary-orange`, `--color-success-green`, etc.)

### Step 5: Create InviteEmployeeModal Component
**File:** `src/components/InviteEmployeeModal.tsx`

Props:
```typescript
interface InviteEmployeeModalProps {
  isOpen: boolean;
  companyId: string;
  availableCrews: string[];
  onClose: () => void;
  onInviteSent: (invite: Invite) => void;
}
```

Layout:
1. Modal header: "Invite a New Worker"
2. Form fields:
   - Email input (required, validated)
   - Phone input (optional)
   - Crew dropdown (required, populated from availableCrews)
   - Hourly rate slider (required, $10–$200, same as Add Employee modal)
   - Send via toggle (Email: ON by default, SMS: greyed out for Phase 2)
3. Actions: Cancel button + "Send Invite" button (disabled if form invalid)
4. Loading state during submission
5. Error message display
6. Success toast after invite sent

Validation:
- Email format check (regex or validator)
- Email not already invited/active (checked in service layer)
- Hourly rate > 0
- Crew selected

Analytics:
- `trackEvent('invite_created', { crew_name, hourly_rate })`

### Step 6: Create InviteManagementPanel Component
**File:** `src/components/InviteManagementPanel.tsx`

Layout:
1. Table with columns:
   - Email
   - Phone
   - Crew
   - Rate
   - Status (use InviteStatusBadge)
   - Sent Date (formatted)
   - Actions (Resend, Revoke buttons)

2. Status filter tabs: All | Pending | Accepted | Expired | Revoked
   - Filter invites on click
   - Show count badge on each tab

3. Empty state: "No invites yet. Click 'Invite a New Worker' to get started."

4. Actions:
   - Resend button (pending only) → call useInvites.resendInvite()
   - Revoke button (pending only) → call useInvites.revokeInvite() with confirmation dialog
   - Confirmation dialog: "Are you sure? This worker won't be able to accept this invite."

5. Loading state: Show skeleton rows while fetching

Analytics:
- `trackEvent('invite_resent', { email })`
- `trackEvent('invite_revoked', { email })`

### Step 7: Create SignupAfterMagicLink Component
**File:** `src/components/SignupAfterMagicLink.tsx`

This component renders ONLY when user lands on `/invite-signup?token=XXX` after clicking magic link.

Flow:
1. On mount, extract token from URL query params
2. Call Supabase to get current session (magic link sets it)
3. Fetch invite record by email + verify token
4. Display form:
   - Welcome header: "Welcome to [Company Name]!"
   - Email field (read-only, pre-filled from invite)
   - Crew display (read-only, from invite)
   - Rate display (read-only, from invite)
   - Password input (required)
   - Confirm password input (required)
   - Phone input (optional, for future OTP)
   - "Set Password & Start Tracking" button

5. On submit:
   - Validate passwords match
   - Validate password strength (8+ chars, 1 uppercase, 1 number)
   - Call inviteService.completeSignup(password, phone)
   - Redirect to `/dashboard` on success
   - Show error toast on failure

6. Error states:
   - Token expired → "This invite has expired. Ask your admin to resend."
   - Email already has account → "An account with this email already exists. Try logging in."
   - Password mismatch → "Passwords don't match."
   - Network error → Show retry button

Styling:
- Center form on page (hero-style layout)
- Orange accent for password strength indicator
- Smooth transitions on state changes

Analytics:
- `trackEvent('signup_started', {})`
- `trackEvent('signup_completed', { crew_name })`

### Step 8: Update App Router
**File:** `src/App.tsx` or `src/main.tsx` (wherever routes are defined)

Add public route:
```typescript
<Route path="/invite-signup" element={<SignupAfterMagicLink />} />
```

This route should NOT require auth (magic link sets session before rendering).

### Step 9: Update TeamManagementPanel
**File:** `src/components/TeamManagementPanel.tsx`

1. Import InviteStatusBadge
2. For each employee in the list:
   - Show InviteStatusBadge if `invite_status === 'pending'`
   - Show badge next to name/email

3. Add context menu option: "Resend Invite" (visible only for pending status)
   - Clicking opens a quick confirmation
   - Calls useInvites.resendInvite()

### Step 10: Update AppShell Navigation
**File:** `src/components/AppShell.tsx` or `src/components/AppNav.tsx`

1. Add "Invite Employee" button in Team Management section header
   - Role-gated: only visible if `user.role === 'admin'`
   - Clicking opens InviteEmployeeModal

2. Modal integration:
```typescript
const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

<InviteEmployeeModal
  isOpen={isInviteModalOpen}
  companyId={data.company_id}
  availableCrews={data.crews}  // Extract from bootstrap payload
  onClose={() => setIsInviteModalOpen(false)}
  onInviteSent={(invite) => {
    setIsInviteModalOpen(false);
    // Show success toast
    // Refresh team management list
  }}
/>
```

### Step 11: Update ManagedEmployee Data Model
**File:** `src/types/models.ts` or wherever types are defined

Update ManagedEmployee interface:
```typescript
interface ManagedEmployee {
  id: string;
  company_id: string;
  email: string;
  phone?: string;
  crew_name: string;
  hourly_rate: number;
  active: boolean;
  // NEW
  invited_by?: string;
  invited_at?: string;
  invite_status: 'active' | 'pending' | 'inactive';
  last_login?: string;
}
```

### Step 12: Wire Analytics
Add `useAnalytics()` hook to all components:
- InviteEmployeeModal: `trackEvent('invite_created', { crew_name, hourly_rate })`
- InviteManagementPanel: `trackEvent('invite_resent', { email })`, `trackEvent('invite_revoked', { email })`
- SignupAfterMagicLink: `trackEvent('signup_started', {})`, `trackEvent('signup_completed', { crew_name })`

## Testing Checklist

- ✅ Admin can open InviteEmployeeModal
- ✅ Form validates email + crew + rate
- ✅ Submit creates invite + sends magic link email
- ✅ Invite appears in InviteManagementPanel with "Pending" status
- ✅ Admin can resend pending invite
- ✅ Admin can revoke pending invite
- ✅ Non-admin users cannot see "Invite Employee" button
- ✅ Clicking magic link in email redirects to `/invite-signup?token=XXX`
- ✅ SignupAfterMagicLink displays pre-filled fields
- ✅ Setting password + clicking submit creates user account
- ✅ Invite status changes to "Accepted"
- ✅ New employee appears in Team Management with crew + rate
- ✅ Analytics events logged for all key actions
- ✅ Error states handled (expired token, duplicate email, etc.)
- ✅ Mobile responsive (form, modals, table)
- ✅ TypeScript passes with zero errors

## Files to Create/Modify

**Create (New):**
- `src/types/invites.ts`
- `src/services/inviteService.ts`
- `src/hooks/useInvites.ts`
- `src/components/InviteEmployeeModal.tsx`
- `src/components/InviteManagementPanel.tsx`
- `src/components/SignupAfterMagicLink.tsx`
- `src/components/InviteStatusBadge.tsx`

**Modify (Existing):**
- `src/App.tsx` — Add `/invite-signup` route
- `src/components/AppShell.tsx` — Add "Invite Employee" button
- `src/components/TeamManagementPanel.tsx` — Show InviteStatusBadge, add Resend option
- `src/types/models.ts` — Add invite_status + invited_by + invited_at to ManagedEmployee

## Edge Cases to Handle

1. **Duplicate Email Invite:** If user tries to invite same email twice, show error: "This worker already has a pending invite. Choose 'Resend' instead."
2. **Expired Invite:** If user clicks magic link after 7 days, show: "This invite has expired. Ask your admin to resend."
3. **Email Already Active:** If invite email matches existing employee, show: "This email is already registered. Try a different email."
4. **Password Requirements:** Enforce 8+ chars, 1 uppercase, 1 number. Show feedback in real-time.
5. **Phone Dedup (Phase 2):** If new user provides phone that matches existing employee, prompt: "We found an existing account with this phone number. Link them?"
6. **Company Isolation:** RLS policies ensure Masonry A can never see Masonry B's invites (verified server-side).
7. **Multi-Crew Scenario:** If company has 10 crews, dropdown shows all. Pre-assignment prevents confusion.

## Success Criteria

- ✅ Admins can create invites with email + pre-assigned crew + rate
- ✅ Magic link sent and verified by Supabase
- ✅ Invitees land on signup form with read-only fields
- ✅ After signup, invite marked as 'accepted', employee appears in Team Management with badge
- ✅ Admins can resend pending invites
- ✅ Admins can revoke pending invites
- ✅ Invites expire after 7 days (auto-marked)
- ✅ Company isolation via RLS
- ✅ TypeScript passes with zero errors
- ✅ Analytics events logged for invite lifecycle
- ✅ All edge cases handled
- ✅ Mobile responsive
- ✅ Accessible (WCAG 2.1 AA) — focus visible, alt text on icons, role attributes on modals

## Notes

- Supabase magic link verification happens automatically when user clicks email link
- No need to manually validate tokens; Supabase sets session + redirects
- RLS policies enforce company_id isolation on backend
- Email provider must be configured in Supabase Auth settings
- For Phase 2 SMS: Add Twilio integration, toggle in InviteEmployeeModal
- localStorage is NOT used for invites; all state is on backend (secure)
- Invites table is small (few hundred rows per company), no pagination needed initially
