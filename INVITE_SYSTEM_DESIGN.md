# Employee Invitation System Design

## Overview
Dual-path invite flow (Email + SMS) with pre-assigned crew + hourly rate, company-scoped isolation via RLS, and immediate visibility in Team Management with "Invite Sent" badge.

---

## 1. Database Schema

### Invites Table
```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scoping
  company_id UUID NOT NULL REFERENCES companies(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Invitee Information
  invitee_email VARCHAR(255) NOT NULL,
  invitee_phone VARCHAR(20),
  
  -- Pre-Assignment
  crew_name VARCHAR(255) NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  
  -- Status Tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Values: 'pending' | 'accepted' | 'expired' | 'revoked'
  
  -- Timing
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Metadata
  token VARCHAR(512) UNIQUE,
  last_sent_at TIMESTAMP,
  send_count INT DEFAULT 0,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  CONSTRAINT valid_rate CHECK (hourly_rate > 0)
);

CREATE INDEX idx_invites_company_id ON invites(company_id);
CREATE INDEX idx_invites_email ON invites(invitee_email);
CREATE INDEX idx_invites_status ON invites(status);
```

### ManagedEmployee Updates
Add columns to track invite origin:
```sql
ALTER TABLE managed_employees ADD COLUMN invited_by UUID REFERENCES auth.users(id);
ALTER TABLE managed_employees ADD COLUMN invited_at TIMESTAMP;
ALTER TABLE managed_employees ADD COLUMN invite_status VARCHAR(50) DEFAULT 'active';
-- Values: 'active' | 'pending' (hasn't logged in yet) | 'inactive'
```

---

## 2. Row Level Security (RLS) Policies

### Invites Table RLS
```sql
-- Admins can create invites for their company
CREATE POLICY "Admins can create invites" ON invites
  FOR INSERT
  WITH CHECK (
    company_id = (auth.jwt() ->> 'company_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'office_manager')
  );

-- Users can view invites for their company
CREATE POLICY "View own company invites" ON invites
  FOR SELECT
  USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Admins can update invites (resend, revoke)
CREATE POLICY "Admins can update invites" ON invites
  FOR UPDATE
  USING (
    company_id = (auth.jwt() ->> 'company_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'office_manager')
  );

-- Admins can delete invites
CREATE POLICY "Admins can revoke invites" ON invites
  FOR DELETE
  USING (
    company_id = (auth.jwt() ->> 'company_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'office_manager')
  );

-- Public access for magic link verification (limited)
CREATE POLICY "Public magic link lookup" ON invites
  FOR SELECT
  USING (token IS NOT NULL)  -- Only via token, no company_id needed
```

### ManagedEmployee Updates
Add invite_status visibility to team members:
```sql
-- Existing policy updates
-- When querying managed_employees, show invite_status
-- Team members can see all employees in their company (no change)
-- Invite_status shows as 'pending' if invite_at is recent and user hasn't logged in
```

---

## 3. TypeScript Types

```typescript
// Invite Interface
interface Invite {
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

// Invite Creation Form Data
interface InviteFormData {
  invitee_email: string;
  invitee_phone?: string;
  crew_name: string;
  hourly_rate: number;
  send_via: 'email' | 'sms';  // Phase 2: SMS
}

// Invite Response from API
interface InviteResponse {
  success: boolean;
  invite_id: string;
  message: string;
  magic_link_sent?: boolean;
  sms_sent?: boolean;
}

// Updated ManagedEmployee (existing + new fields)
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

// Signup After Magic Link
interface SignupFormData {
  email: string;  // Read-only, pre-filled
  password: string;
  confirm_password: string;
  phone?: string;  // Optional confirmation
}
```

---

## 4. Component Structure

### InviteEmployeeModal.tsx
**Purpose:** Admin-only modal to create and send invites.

**Props:**
```typescript
interface InviteEmployeeModalProps {
  isOpen: boolean;
  companyId: string;
  availableCrews: string[];  // From bootstrap payload
  onClose: () => void;
  onInviteSent: (invite: Invite) => void;
}
```

**Features:**
- Email input (required) + phone input (optional)
- Crew dropdown (pre-assigned, not user choice)
- Hourly rate slider (same as Add Employee modal)
- Send via Email toggle (Email: ON by default, SMS: greyed out for Phase 2)
- Loading state during API call
- Success/error toast notifications
- "Resend" option if invite already exists for that email

**Validation:**
- Email format
- Hourly rate > 0
- Crew selected
- Email not already invited/active in company

### InviteManagementPanel.tsx
**Purpose:** View all invites (pending, accepted, revoked) with resend/revoke actions.

**Layout:**
- Table with columns: Email | Phone | Crew | Rate | Status | Sent Date | Actions
- Status badges:
  - 🟠 "Pending" (orange) — awaiting acceptance
  - 🟢 "Accepted" (green) — user has logged in
  - ⚪ "Expired" (gray) — 7-day window passed
  - 🚫 "Revoked" (red) — admin cancelled
- Filter tabs: All | Pending | Accepted | Expired | Revoked
- Resend button (for pending only) — increments send_count, updates last_sent_at
- Revoke button (for pending only) — sets status to revoked

**Analytics:**
- Track: invite_created, invite_sent, invite_accepted, invite_revoked, invite_resent

### SignupAfterMagicLink.tsx
**Purpose:** Lightweight form after user clicks magic link from email.

**Flow:**
1. User clicks link in email → `redirectTo=https://app.myguystime.com/invite-signup?token=XXX`
2. Supabase verifies token, sets session
3. SignupAfterMagicLink component loads
4. Display:
   - "Welcome to [Company Name]!"
   - Email field (read-only, pre-filled): `invitee_email`
   - Crew display (read-only): `crew_name`
   - Rate display (read-only): `$hourly_rate / hour`
   - Password input (required)
   - Confirm password (required)
   - Phone input (optional) — for SMS OTP future phase
   - "Set Password & Start Tracking" button

**On Submit:**
- Validate passwords match + complexity (8+ chars, 1 uppercase, 1 number)
- Supabase `.signUp()` with email + password
- Update invite status to 'accepted' + set accepted_at
- Create ManagedEmployee record with:
  - email, phone, crew_name, hourly_rate
  - invite_status: 'active'
  - invited_by, invited_at (from invite record)
  - active: true (immediately active)
- Redirect to main app dashboard
- Show toast: "Welcome! Your account is set up. Start tracking your hours."

**Error Handling:**
- Token expired → "This invite has expired. Ask your admin to resend."
- Email already exists → "An account with this email already exists. Try logging in."
- Password mismatch → "Passwords don't match."
- Network error → Retry button

### InviteStatusBadge.tsx
**Purpose:** Small reusable component for showing invite status in Team Management.

**Props:**
```typescript
interface InviteStatusBadgeProps {
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
  acceptedAt?: string;
}
```

**Rendering:**
- Pending: 🟠 "Invite Sent" (orange badge, 2px border)
- Accepted: ✅ "Active" (green checkmark)
- Expired: ⏱️ "Invite Expired" (gray, 2px dashed border)
- Revoked: 🚫 "Revoked" (red, strikethrough)

---

## 5. API Endpoints (Edge Functions)

### POST /invite-employee
**Handler:** Create and send magic link invite.

**Request:**
```json
{
  "invitee_email": "worker@example.com",
  "invitee_phone": "+1-555-0123",
  "crew_name": "Truck 1",
  "hourly_rate": 25.50,
  "send_via": "email"
}
```

**Response:**
```json
{
  "success": true,
  "invite_id": "uuid",
  "message": "Invite sent to worker@example.com",
  "magic_link_sent": true
}
```

**Logic:**
1. Check user role: must be admin or office_manager
2. Check company_id from JWT
3. Check email not already in managed_employees (active)
4. Check email not pending invite (resend logic instead)
5. Generate secure token (32 bytes, base64)
6. Insert into invites table
7. Send email via Supabase Auth `.admin.generateLink()` or custom mailer
8. Return invite_id + success

### POST /invite-employee/resend
**Handler:** Resend invite email for pending invites.

**Request:**
```json
{
  "invite_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invite resent to worker@example.com",
  "last_sent_at": "2026-04-23T14:30:00Z",
  "send_count": 2
}
```

**Logic:**
1. Check invite exists + status is 'pending' + not expired
2. Increment send_count, update last_sent_at
3. Resend magic link email
4. Return success

### DELETE /invite-employee/:invite_id
**Handler:** Revoke pending invite.

**Request:** (no body)

**Response:**
```json
{
  "success": true,
  "message": "Invite revoked. worker@example.com will no longer be able to accept.",
  "invite_id": "uuid"
}
```

**Logic:**
1. Check invite exists + status is 'pending'
2. Set status to 'revoked'
3. Return success

### POST /signup-after-invite
**Handler:** Complete signup after magic link click.

**Request:**
```json
{
  "password": "SecurePass123!",
  "phone": "+1-555-0123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "employee_id": "uuid",
  "redirect_to": "/dashboard"
}
```

**Logic:**
1. Get current session (set by magic link)
2. Get invite record by email + token
3. Validate password (8+ chars, 1 uppercase, 1 number)
4. Create/update ManagedEmployee:
   - email, crew_name, hourly_rate (from invite)
   - phone (if provided)
   - invited_by, invited_at (from invite)
   - invite_status: 'active'
   - active: true
5. Update invite status to 'accepted' + set accepted_at
6. Return success + redirect_to

---

## 6. Integration Points

### AppShell.tsx
- Add "Invite Employee" button in Team Management section (role-gated: admin/office_manager only)
- Clicking opens InviteEmployeeModal
- OnInviteSent callback refreshes Team Management employee list

### TeamManagementPanel.tsx
- Add InviteStatusBadge next to each employee
- Show 🟠 "Invite Sent" for employees with invite_status === 'pending'
- Show "Resend Invite" option in context menu for pending invites

### App.tsx
- Add route: `/invite-signup?token=XXX` → renders SignupAfterMagicLink
- Redirect `/` if user not logged in (Supabase auth guard)

### main.tsx / Router
- Public route for magic link landing (no auth required initially)
- Private routes for all other pages

---

## 7. Security Checklist

- ✅ RLS policies enforce company_id isolation
- ✅ Role check: only admin/office_manager can create invites
- ✅ Token validation: Supabase magic link handles cryptography
- ✅ Expiry: 7-day window, auto-mark expired
- ✅ Email validation: Prevent typos, duplicate sends
- ✅ Password requirements: 8+ chars, uppercase, number
- ✅ Phone optional: No forced SMS (Phase 2)
- ✅ Dedup logic: Check existing email before invite

---

## 8. Phasing

**Phase 1 (This Task):**
- Email magic link invites
- Pre-assigned crew + rate
- Invite management (resend, revoke)
- Signup form after magic link
- Pending status badge in Team Management

**Phase 2 (Future):**
- SMS OTP invites (Twilio)
- Phone number verification + linking
- "Bulk invite" (CSV upload)
- Invite templates / custom messages

---

## 9. Files to Create

```
src/
  components/
    InviteEmployeeModal.tsx         [~280 lines]
    InviteManagementPanel.tsx       [~320 lines]
    SignupAfterMagicLink.tsx        [~240 lines]
    InviteStatusBadge.tsx           [~60 lines]
  hooks/
    useInvites.ts                   [~150 lines]
  types/
    invites.ts                      [~50 lines]
  services/
    inviteService.ts                [~120 lines]
```

---

## Success Criteria

- ✅ Admins can create invites with email + pre-assigned crew + rate
- ✅ Magic link sent and verified by Supabase
- ✅ Invitees land on signup form with read-only fields
- ✅ After signup, invite marked as 'accepted', employee appears in Team Management with badge
- ✅ Admins can resend pending invites
- ✅ Admins can revoke pending invites
- ✅ Invites expire after 7 days (auto-marked)
- ✅ Company isolation via RLS (Masonry A can't see Masonry B's invites)
- ✅ TypeScript passes with zero errors
- ✅ Analytics events logged for invite lifecycle
- ✅ All edge cases handled (duplicate email, expired token, etc.)
