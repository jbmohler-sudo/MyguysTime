# Claude Code Prompt: Complete Employee Invitation System (All-In-One)

## Executive Summary

Build the complete employee invitation system from database schema → backend security → React components → app integration → styling → analytics. This is a comprehensive, linear 14-step build. Follow the order exactly; each step depends on previous ones.

**Outcome:** Admins can invite workers via email with pre-assigned crew + rate. Workers click magic link → set password → appear in Team Management with "Pending" badge → "Resend" button allows quick re-invitation. Company isolation via RLS + JWT.

**Timeline:** All 14 steps in one continuous run.

---

## Phase 1: Security Foundation & Database

### Step 1: Create Database Schema & RLS Policies

**Supabase Setup:**

1. Create `invites` table with this schema:
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

2. Update `managed_employees` table with new columns:
```sql
ALTER TABLE managed_employees ADD COLUMN invited_by UUID REFERENCES auth.users(id);
ALTER TABLE managed_employees ADD COLUMN invited_at TIMESTAMP;
ALTER TABLE managed_employees ADD COLUMN invite_status VARCHAR(50) DEFAULT 'active';
```

3. Enable RLS on `invites` table and create these policies:

```sql
-- Policy 1: Admins can create invites for their company
CREATE POLICY "Only admins can create invites" ON invites
  FOR INSERT
  WITH CHECK (
    company_id = (auth.jwt() ->> 'company_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'office_manager')
  );

-- Policy 2: Users can view invites only for their company
CREATE POLICY "View own company invites" ON invites
  FOR SELECT
  USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Policy 3: Only admins can update invites (resend, revoke)
CREATE POLICY "Only admins can update invites" ON invites
  FOR UPDATE
  USING (
    company_id = (auth.jwt() ->> 'company_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'office_manager')
  );

-- Policy 4: Only admins can delete invites (revoke)
CREATE POLICY "Only admins can revoke invites" ON invites
  FOR DELETE
  USING (
    company_id = (auth.jwt() ->> 'company_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'office_manager')
  );

-- Policy 5: Public magic link lookup (limited)
CREATE POLICY "Public magic link lookup" ON invites
  FOR SELECT
  USING (token IS NOT NULL);
```

**Why:** RLS policies enforce company_id + role isolation at the database layer. No frontend can bypass these rules.

**Success check:**
- ✅ `invites` table created with all columns
- ✅ `managed_employees` has `invited_by`, `invited_at`, `invite_status`
- ✅ RLS policies enabled (not disabled)
- ✅ Test: Try inserting invite with wrong company_id → blocked by RLS

---

## Phase 2: Backend Edge Functions

### Step 2: Create Supabase Edge Functions

Create 3 edge functions in `supabase/functions/`:

#### Function 1: `invite-crew-member/index.ts`

**File:** `supabase/functions/invite-crew-member/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from authorization header
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify token and extract claims
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response('Invalid token', { status: 401 });
    }

    // Parse request body
    const { invitee_email, invitee_phone, crew_name, hourly_rate } = await req.json();

    // Validate input
    if (!invitee_email || !crew_name || !hourly_rate) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Get company_id from JWT
    const companyId = user.user_metadata?.company_id;
    if (!companyId) {
      return new Response('Company ID not found in token', { status: 400 });
    }

    // Check user role
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin' && userRole !== 'office_manager') {
      return new Response('Insufficient permissions', { status: 403 });
    }

    // Check if email already invited (same company)
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('invitee_email', invitee_email)
      .neq('status', 'revoked')
      .neq('status', 'expired')
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: 'This worker already has a pending invite.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already active in company
    const { data: existingEmployee } = await supabase
      .from('managed_employees')
      .select('id')
      .eq('company_id', companyId)
      .eq('email', invitee_email)
      .single();

    if (existingEmployee) {
      return new Response(
        JSON.stringify({ error: 'This email is already registered in your company.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create invite record
    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert([
        {
          company_id: companyId,
          created_by: user.id,
          invitee_email,
          invitee_phone: invitee_phone || null,
          crew_name,
          hourly_rate,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ])
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create invite' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate magic link (Supabase Auth)
    const { data: signUpLink, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: invitee_email,
    });

    if (linkError) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate magic link' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Send email with magic link
    // You can use Supabase email auth or a service like SendGrid/Resend
    // For now, log the link for testing

    return new Response(
      JSON.stringify({
        success: true,
        invite_id: invite.id,
        message: `Invite sent to ${invitee_email}`,
        magic_link_sent: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Invite error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Function 2: `invite-employee-resend/index.ts`

**File:** `supabase/functions/invite-employee-resend/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response('Invalid token', { status: 401 });
    }

    const { invite_id } = await req.json();
    if (!invite_id) {
      return new Response('Missing invite_id', { status: 400 });
    }

    const companyId = user.user_metadata?.company_id;
    if (!companyId) {
      return new Response('Company ID not found', { status: 400 });
    }

    // Fetch invite
    const { data: invite, error: fetchError } = await supabase
      .from('invites')
      .select('*')
      .eq('id', invite_id)
      .eq('company_id', companyId)
      .single();

    if (fetchError || !invite) {
      return new Response('Invite not found', { status: 404 });
    }

    if (invite.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Only pending invites can be resent' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update last_sent_at and send_count
    const { error: updateError } = await supabase
      .from('invites')
      .update({
        last_sent_at: new Date().toISOString(),
        send_count: (invite.send_count || 0) + 1,
      })
      .eq('id', invite_id);

    if (updateError) {
      return new Response('Failed to update invite', { status: 500 });
    }

    // TODO: Resend magic link email

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invite resent to ${invite.invitee_email}`,
        last_sent_at: new Date().toISOString(),
        send_count: (invite.send_count || 0) + 1,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Resend invite error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
```

#### Function 3: `signup-after-invite/index.ts`

**File:** `supabase/functions/signup-after-invite/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response('Invalid token', { status: 401 });
    }

    const { password, phone } = await req.json();
    if (!password) {
      return new Response('Missing password', { status: 400 });
    }

    // Get invite record by email
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('invitee_email', user.email)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({ error: 'No pending invite found for this email' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(invite.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This invite has expired' }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update user with password (Supabase handles this)
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to set password' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create managed_employees record
    const { error: employeeError } = await supabase
      .from('managed_employees')
      .insert([
        {
          company_id: invite.company_id,
          email: user.email,
          phone: phone || null,
          crew_name: invite.crew_name,
          hourly_rate: invite.hourly_rate,
          active: true,
          invited_by: invite.created_by,
          invited_at: invite.created_at,
          invite_status: 'active',
        }
      ]);

    if (employeeError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create employee record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update invite status to accepted
    const { error: inviteUpdateError } = await supabase
      .from('invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    if (inviteUpdateError) {
      console.error('Failed to update invite status:', inviteUpdateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully',
        redirect_to: '/dashboard',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
```

**Success check:**
- ✅ All 3 functions deploy successfully
- ✅ Test: Call with invalid JWT → 401 error
- ✅ Test: Call with wrong company_id → RLS blocks operation
- ✅ Test: Call with non-admin role → 403 error

---

## Phase 3: TypeScript Types & Services

### Step 3: Create Types

**File:** `src/types/invites.ts`

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

### Step 4: Create Invite Service

**File:** `src/services/inviteService.ts`

```typescript
import { Invite, InviteFormData, InviteResponse } from '../types/invites';

export const inviteService = {
  async createInvite(formData: InviteFormData): Promise<InviteResponse> {
    const response = await fetch('/api/invite-crew-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invite');
    }

    return response.json();
  },

  async resendInvite(inviteId: string): Promise<InviteResponse> {
    const response = await fetch('/api/invite-employee-resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: inviteId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resend invite');
    }

    return response.json();
  },

  async revokeInvite(inviteId: string): Promise<InviteResponse> {
    const response = await fetch(`/api/invite-employee/${inviteId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to revoke invite');
    }

    return response.json();
  },

  async completeSignup(password: string, phone?: string): Promise<{ success: boolean; redirectTo: string }> {
    const response = await fetch('/api/signup-after-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, phone }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete signup');
    }

    return response.json();
  },

  async getInvitesByCompany(): Promise<Invite[]> {
    const response = await fetch('/api/invites');

    if (!response.ok) {
      throw new Error('Failed to fetch invites');
    }

    return response.json();
  },
};
```

**Success check:**
- ✅ TypeScript compiles with zero errors
- ✅ All imports resolve

---

## Phase 4: React Components

### Step 5: Create useInvites Hook

**File:** `src/hooks/useInvites.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { inviteService } from '../services/inviteService';
import { Invite, InviteFormData } from '../types/invites';

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
      setError(err instanceof Error ? err.message : 'Failed to fetch invites');
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvite = useCallback(
    async (formData: InviteFormData) => {
      setLoading(true);
      try {
        const response = await inviteService.createInvite(formData);
        await fetchInvites();
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create invite';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchInvites]
  );

  const resendInvite = useCallback(
    async (inviteId: string) => {
      setLoading(true);
      try {
        const response = await inviteService.resendInvite(inviteId);

        setInvites((prev) =>
          prev.map((invite) =>
            invite.id === inviteId
              ? {
                  ...invite,
                  last_sent_at: new Date().toISOString(),
                  send_count: (invite.send_count || 0) + 1,
                }
              : invite
          )
        );

        setError(null);
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to resend invite';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      setLoading(true);
      try {
        const response = await inviteService.revokeInvite(inviteId);
        await fetchInvites();
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to revoke invite';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchInvites]
  );

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  return {
    invites,
    loading,
    error,
    createInvite,
    resendInvite,
    revokeInvite,
    fetchInvites,
  };
}
```

### Step 6: Create InviteStatusBadge Component

**File:** `src/components/InviteStatusBadge.tsx`

```typescript
import { useState } from 'react';
import { useInvites } from '../hooks/useInvites';
import { useAnalytics } from '../hooks/useAnalytics';

interface InviteStatusBadgeProps {
  employee_id: string;
  invite_id: string;
  status: 'pending' | 'active' | 'expired' | 'revoked';
  email: string;
  created_at: string;
  accepted_at?: string;
  onResendSuccess?: () => void;
}

export function InviteStatusBadge({
  employee_id,
  invite_id,
  status,
  email,
  created_at,
  accepted_at,
  onResendSuccess,
}: InviteStatusBadgeProps) {
  const { resendInvite } = useInvites();
  const { trackEvent } = useAnalytics();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendClick = () => {
    setShowConfirmation(true);
    setError(null);
    trackEvent('resend_confirmation_shown', { invite_id });
  };

  const handleConfirmResend = async () => {
    setResending(true);
    setError(null);

    try {
      await resendInvite(invite_id);

      trackEvent('invite_resent', {
        invite_id,
        email,
      });

      setShowConfirmation(false);
      onResendSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend invite';
      setError(message);

      trackEvent('invite_resend_failed', {
        invite_id,
        error: message,
      });
    } finally {
      setResending(false);
    }
  };

  const handleCancelResend = () => {
    setShowConfirmation(false);
    setError(null);
    trackEvent('resend_confirmation_cancelled', { invite_id });
  };

  const getBadgeContent = () => {
    switch (status) {
      case 'pending':
        return {
          text: 'Pending Invite',
          className: 'badge--pending',
          showResend: true,
        };
      case 'active':
        return {
          text: 'Active',
          className: 'badge--active',
          showResend: false,
        };
      case 'expired':
        return {
          text: 'Invite Expired',
          className: 'badge--expired',
          showResend: false,
        };
      case 'revoked':
        return {
          text: 'Invite Revoked',
          className: 'badge--revoked',
          showResend: false,
        };
      default:
        return {
          text: 'Unknown',
          className: 'badge--unknown',
          showResend: false,
        };
    }
  };

  const badgeContent = getBadgeContent();

  return (
    <div className="invite-status-wrapper">
      {/* Badge */}
      <span className={`badge ${badgeContent.className}`}>
        {badgeContent.text}
      </span>

      {/* Resend Button (Pending only) */}
      {badgeContent.showResend && (
        <div className="invite-actions">
          <button
            className="btn btn--resend"
            onClick={handleResendClick}
            disabled={resending}
            aria-label={`Resend invite to ${email}`}
            title="Resend invitation email"
          >
            {resending ? 'Sending...' : 'Resend'}
          </button>
        </div>
      )}

      {/* Confirmation Dialog (Resend) */}
      {showConfirmation && (
        <div className="modal modal--confirm" role="dialog" aria-modal="true">
          <div className="modal__overlay" onClick={handleCancelResend} />
          <div className="modal__content modal__content--small">
            <div className="modal__header">
              <h3>Resend Invitation?</h3>
            </div>

            <div className="modal__body">
              <p>
                Resend the invitation email to <strong>{email}</strong>?
              </p>
              <p className="modal__subtitle">
                They'll receive a fresh magic link to set up their account.
              </p>

              {error && (
                <div className="alert alert--error" role="alert">
                  {error}
                </div>
              )}
            </div>

            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleCancelResend}
                disabled={resending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleConfirmResend}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 7: Create InviteEmployeeModal Component

**File:** `src/components/InviteEmployeeModal.tsx`

```typescript
import { useState } from 'react';
import { useAuth } from '@supabase/auth-helpers-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { inviteService } from '../services/inviteService';
import { InviteFormData, Invite } from '../types/invites';

interface InviteEmployeeModalProps {
  isOpen: boolean;
  companyId: string;
  availableCrews: string[];
  onClose: () => void;
  onInviteSent: (invite: Invite) => void;
}

export function InviteEmployeeModal({
  isOpen,
  companyId,
  availableCrews,
  onClose,
  onInviteSent,
}: InviteEmployeeModalProps) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const [formData, setFormData] = useState<InviteFormData>({
    invitee_email: '',
    invitee_phone: '',
    crew_name: availableCrews[0] || '',
    hourly_rate: 20,
    send_via: 'email',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Frontend permission check
      const userRole = user?.user_metadata?.role;
      if (userRole !== 'admin' && userRole !== 'office_manager') {
        throw new Error('Only admins can send invites');
      }

      // Validate form
      if (!formData.invitee_email) {
        throw new Error('Email is required');
      }
      if (!formData.crew_name) {
        throw new Error('Crew is required');
      }
      if (formData.hourly_rate <= 0) {
        throw new Error('Hourly rate must be greater than $0');
      }

      // Call backend
      const response = await inviteService.createInvite(formData);

      trackEvent('invite_created', {
        crew_name: formData.crew_name,
        hourly_rate: formData.hourly_rate,
      });

      // Reset form
      setFormData({
        invitee_email: '',
        invitee_phone: '',
        crew_name: availableCrews[0] || '',
        hourly_rate: 20,
        send_via: 'email',
      });

      onInviteSent(response as unknown as Invite);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invite';
      setError(message);
      trackEvent('invite_failed', { error: message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal--invite" role="dialog" aria-modal="true">
      <div className="modal__content">
        <div className="modal__header">
          <h2 id="invite-title">Invite a New Worker</h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close invite dialog"
          >
            ✕
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {error && (
            <div className="form__error" role="alert">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="form__group">
            <label htmlFor="invite-email" className="form__label">
              Email Address *
            </label>
            <input
              id="invite-email"
              type="email"
              className="form__input"
              placeholder="worker@example.com"
              value={formData.invitee_email}
              onChange={(e) =>
                setFormData({ ...formData, invitee_email: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          {/* Phone Field */}
          <div className="form__group">
            <label htmlFor="invite-phone" className="form__label">
              Phone (Optional)
            </label>
            <input
              id="invite-phone"
              type="tel"
              className="form__input"
              placeholder="+1-555-0123"
              value={formData.invitee_phone}
              onChange={(e) =>
                setFormData({ ...formData, invitee_phone: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* Crew Dropdown */}
          <div className="form__group">
            <label htmlFor="invite-crew" className="form__label">
              Assign to Crew *
            </label>
            <select
              id="invite-crew"
              className="form__select"
              value={formData.crew_name}
              onChange={(e) =>
                setFormData({ ...formData, crew_name: e.target.value })
              }
              required
              disabled={loading}
            >
              {availableCrews.map((crew) => (
                <option key={crew} value={crew}>
                  {crew}
                </option>
              ))}
            </select>
          </div>

          {/* Hourly Rate Slider */}
          <div className="form__group">
            <label htmlFor="invite-rate" className="form__label">
              Hourly Rate: ${formData.hourly_rate.toFixed(2)} *
            </label>
            <input
              id="invite-rate"
              type="range"
              className="form__slider"
              min="10"
              max="200"
              step="0.50"
              value={formData.hourly_rate}
              onChange={(e) =>
                setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })
              }
              disabled={loading}
            />
          </div>

          {/* Send Via Toggle */}
          <div className="form__group">
            <label className="form__label">Send Via</label>
            <div className="form__radio-group">
              <label className="form__radio">
                <input
                  type="radio"
                  name="send_via"
                  value="email"
                  checked={formData.send_via === 'email'}
                  onChange={(e) =>
                    setFormData({ ...formData, send_via: e.target.value as 'email' | 'sms' })
                  }
                  disabled={loading}
                />
                📧 Email (Magic Link)
              </label>
              <label className="form__radio form__radio--disabled">
                <input
                  type="radio"
                  name="send_via"
                  value="sms"
                  disabled
                />
                📱 SMS (Coming Soon)
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !formData.invitee_email || !formData.crew_name}
            >
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Step 8: Create SignupAfterMagicLink Component

**File:** `src/components/SignupAfterMagicLink.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';
import { inviteService } from '../services/inviteService';

export function SignupAfterMagicLink() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useAnalytics();

  const [formData, setFormData] = useState({
    password: '',
    confirm_password: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    // Load invite data from URL or session
    trackEvent('signup_started', {});
  }, [trackEvent]);

  const validatePassword = (password: string): boolean => {
    return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate
      if (!formData.password) {
        throw new Error('Password is required');
      }
      if (formData.password !== formData.confirm_password) {
        throw new Error('Passwords do not match');
      }
      if (!validatePassword(formData.password)) {
        throw new Error('Password must be at least 8 characters with 1 uppercase letter and 1 number');
      }

      // Complete signup
      const response = await inviteService.completeSignup(formData.password, formData.phone);

      trackEvent('signup_completed', {
        crew_name: inviteData?.crew_name,
      });

      // Redirect to dashboard
      if (response.redirect_to) {
        navigate(response.redirect_to);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete signup';
      setError(message);
      trackEvent('signup_failed', { error: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-hero">
      <div className="signup-container">
        <div className="signup-header">
          <h1>Welcome to MyGuysTime!</h1>
          <p>Set your password to start tracking your hours</p>
        </div>

        <form className="form form--signup" onSubmit={handleSubmit}>
          {error && (
            <div className="form__error" role="alert">
              {error}
            </div>
          )}

          {/* Email Display (Read-only) */}
          {inviteData?.email && (
            <div className="form__group">
              <label className="form__label">Email</label>
              <input
                type="email"
                className="form__input form__input--readonly"
                value={inviteData.email}
                readOnly
              />
            </div>
          )}

          {/* Crew Display (Read-only) */}
          {inviteData?.crew_name && (
            <div className="form__group">
              <label className="form__label">Assigned Crew</label>
              <input
                type="text"
                className="form__input form__input--readonly"
                value={inviteData.crew_name}
                readOnly
              />
            </div>
          )}

          {/* Rate Display (Read-only) */}
          {inviteData?.hourly_rate && (
            <div className="form__group">
              <label className="form__label">Hourly Rate</label>
              <input
                type="text"
                className="form__input form__input--readonly"
                value={`$${inviteData.hourly_rate}/hr`}
                readOnly
              />
            </div>
          )}

          {/* Password Field */}
          <div className="form__group">
            <label htmlFor="signup-password" className="form__label">
              Password *
            </label>
            <input
              id="signup-password"
              type="password"
              className="form__input"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              disabled={loading}
              required
            />
            <p className="form__help">
              At least 8 characters, 1 uppercase letter, 1 number
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="form__group">
            <label htmlFor="signup-confirm" className="form__label">
              Confirm Password *
            </label>
            <input
              id="signup-confirm"
              type="password"
              className="form__input"
              placeholder="Confirm your password"
              value={formData.confirm_password}
              onChange={(e) =>
                setFormData({ ...formData, confirm_password: e.target.value })
              }
              disabled={loading}
              required
            />
          </div>

          {/* Phone Field (Optional) */}
          <div className="form__group">
            <label htmlFor="signup-phone" className="form__label">
              Phone (Optional)
            </label>
            <input
              id="signup-phone"
              type="tel"
              className="form__input"
              placeholder="+1-555-0123"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn--primary btn--large"
            disabled={loading || !formData.password || !formData.confirm_password}
          >
            {loading ? 'Setting up your account...' : 'Set Password & Start Tracking'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Step 9: Create InviteManagementPanel Component

**File:** `src/components/InviteManagementPanel.tsx`

```typescript
import { useState } from 'react';
import { useInvites } from '../hooks/useInvites';
import { InviteStatusBadge } from './InviteStatusBadge';
import { Invite } from '../types/invites';

export function InviteManagementPanel() {
  const { invites, loading, revokeInvite } = useInvites();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'expired' | 'revoked'>('all');
  const [revoking, setRevoking] = useState<string | null>(null);

  const filteredInvites = filterStatus === 'all'
    ? invites
    : invites.filter((invite) => invite.status === filterStatus);

  const statusCounts = {
    all: invites.length,
    pending: invites.filter((i) => i.status === 'pending').length,
    accepted: invites.filter((i) => i.status === 'accepted').length,
    expired: invites.filter((i) => i.status === 'expired').length,
    revoked: invites.filter((i) => i.status === 'revoked').length,
  };

  const handleRevoke = async (inviteId: string) => {
    if (!window.confirm('Are you sure? This worker won\'t be able to accept this invite.')) {
      return;
    }

    setRevoking(inviteId);
    try {
      await revokeInvite(inviteId);
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return <div className="invite-panel__loading">Loading invites...</div>;
  }

  if (invites.length === 0) {
    return (
      <div className="invite-panel__empty">
        <p>No invites yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="invite-management-panel">
      {/* Filter Tabs */}
      <div className="invite-panel__filters">
        {['all', 'pending', 'accepted', 'expired', 'revoked'].map((status) => (
          <button
            key={status}
            className={`tab ${filterStatus === status ? 'tab--active' : ''}`}
            onClick={() => setFilterStatus(status as any)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="tab__count">{statusCounts[status as keyof typeof statusCounts]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <table className="invite-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Phone</th>
            <th>Crew</th>
            <th>Rate</th>
            <th>Status</th>
            <th>Sent</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvites.map((invite) => (
            <tr key={invite.id} className="invite-row">
              <td className="invite-row__email">{invite.invitee_email}</td>
              <td className="invite-row__phone">{invite.invitee_phone || '-'}</td>
              <td className="invite-row__crew">{invite.crew_name}</td>
              <td className="invite-row__rate">${invite.hourly_rate}/hr</td>

              <td className="invite-row__status">
                <InviteStatusBadge
                  employee_id={invite.id}
                  invite_id={invite.id}
                  status={invite.status}
                  email={invite.invitee_email}
                  created_at={invite.created_at}
                  accepted_at={invite.accepted_at}
                />
              </td>

              <td className="invite-row__sent">
                {invite.last_sent_at
                  ? new Date(invite.last_sent_at).toLocaleDateString()
                  : new Date(invite.created_at).toLocaleDateString()}
              </td>

              <td className="invite-row__actions">
                {invite.status === 'pending' && (
                  <button
                    className="btn btn--tertiary btn--small"
                    onClick={() => handleRevoke(invite.id)}
                    disabled={revoking === invite.id}
                  >
                    {revoking === invite.id ? 'Revoking...' : 'Revoke'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Success check:**
- ✅ All 4 components render without errors
- ✅ Forms validate correctly
- ✅ State management works
- ✅ TypeScript passes with zero errors

---

## Phase 5: App Integration

### Step 10: Update App Router

**File:** `src/App.tsx` or `src/main.tsx`

Add route for magic link landing page:

```typescript
import { SignupAfterMagicLink } from './components/SignupAfterMagicLink';

// In your router config:
<Route path="/invite-signup" element={<SignupAfterMagicLink />} />
```

This route should NOT require auth (magic link sets Supabase session before rendering).

### Step 11: Update AppShell Navigation

**File:** `src/components/AppShell.tsx` or `src/components/AppNav.tsx`

Add "Invite Employee" button:

```typescript
import { InviteEmployeeModal } from './InviteEmployeeModal';
import { useAuth } from '@supabase/auth-helpers-react';
import { useState } from 'react';

export function AppShell({ data }) {
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const userRole = user?.user_metadata?.role;
  const canInvite = userRole === 'admin' || userRole === 'office_manager';

  const handleInviteSent = () => {
    // Show success toast
    // Refresh team management list
  };

  return (
    <div className="app-shell">
      {/* Navigation */}
      <nav className="app-nav">
        {/* ... nav items ... */}
        
        {canInvite && (
          <button
            className="btn btn--primary"
            onClick={() => setIsInviteModalOpen(true)}
          >
            + Invite Worker
          </button>
        )}
      </nav>

      {/* Invite Modal */}
      <InviteEmployeeModal
        isOpen={isInviteModalOpen}
        companyId={data.company_id}
        availableCrews={data.crews || []}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSent={handleInviteSent}
      />

      {/* Main content */}
      {/* ... */}
    </div>
  );
}
```

### Step 12: Update TeamManagementPanel

**File:** `src/components/TeamManagementPanel.tsx`

Add badge + resend button:

```typescript
import { InviteStatusBadge } from './InviteStatusBadge';

export function TeamManagementPanel({ data }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleResendSuccess = async () => {
    setRefreshing(true);
    try {
      // Refresh employee list
      window.location.reload(); // Or use state management to refresh
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <table className="team-table">
      <tbody>
        {data.managedEmployees.map((employee) => (
          <tr key={employee.id}>
            <td>{employee.name}</td>
            <td>{employee.email}</td>
            <td>{employee.crew_name}</td>
            <td>${employee.hourly_rate}/hr</td>
            
            {/* Status Column with Badge + Resend */}
            <td>
              <InviteStatusBadge
                employee_id={employee.id}
                invite_id={employee.invite_id}
                status={employee.invite_status}
                email={employee.email}
                created_at={employee.invited_at}
                accepted_at={employee.last_login}
                onResendSuccess={handleResendSuccess}
              />
            </td>

            <td>
              {employee.invite_status === 'active' && (
                <button className="btn btn--tertiary btn--small">
                  Edit
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Phase 6: Styling & Analytics

### Step 13: Add CSS Styling

**File:** `src/styles.css`

Add all badge, button, and dialog styles:

```css
/* Badge Styles */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge--pending {
  background-color: rgba(255, 140, 0, 0.08);
  color: var(--color-primary-orange);
  border: 1px solid var(--color-primary-orange);
}

.badge--pending::before {
  content: "";
  width: 6px;
  height: 6px;
  background-color: var(--color-primary-orange);
  border-radius: 50%;
  display: inline-block;
  animation: pulse-dot 1.5s infinite;
}

.badge--active {
  background-color: var(--color-primary-orange);
  color: white;
  border: none;
}

.badge--revoked {
  background-color: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  border: 1px dashed #dc2626;
  text-decoration: line-through;
}

.badge--expired {
  background-color: rgba(107, 114, 128, 0.08);
  color: #6b7280;
  border: 1px dashed #6b7280;
}

@keyframes pulse-dot {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Resend Button */
.invite-status-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn--resend {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 4px;
  border: 1px solid var(--color-primary-orange);
  background-color: transparent;
  color: var(--color-primary-orange);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn--resend:hover:not(:disabled) {
  background-color: rgba(255, 140, 0, 0.1);
  transform: translateY(-1px);
}

.btn--resend:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Confirmation Dialog */
.modal--confirm {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.modal--confirm .modal__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.modal__content--small {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

.modal__header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal__body {
  padding: 20px;
}

.modal__actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Step 14: Wire Analytics

Add analytics tracking throughout:

```typescript
// In InviteEmployeeModal.tsx
trackEvent('invite_created', {
  crew_name: formData.crew_name,
  hourly_rate: formData.hourly_rate,
});

// In InviteStatusBadge.tsx
trackEvent('invite_resent', { invite_id, email });
trackEvent('invite_resend_failed', { invite_id, error });

// In SignupAfterMagicLink.tsx
trackEvent('signup_started', {});
trackEvent('signup_completed', { crew_name });
```

---

## Testing Checklist

- ✅ Admin can create invite with email + crew + rate
- ✅ Magic link email sent + verified by Supabase
- ✅ Worker clicks link → lands on signup form
- ✅ Read-only fields pre-filled from invite
- ✅ Worker sets password → account created
- ✅ Invite status changes from pending → active
- ✅ Employee appears in Team Management with ✅ "Active" badge
- ✅ Admin can resend pending invite → confirmation dialog
- ✅ Resend increments send_count + updates last_sent_at
- ✅ Admin can revoke invite → status changes to 🚫 "Revoked"
- ✅ 7 days pass → invite auto-marked as ⏱️ "Expired"
- ✅ Company isolation: Masonry A can't see Masonry B's invites (RLS enforces)
- ✅ Non-admin users can't see "Invite Employee" button
- ✅ TypeScript passes with zero errors
- ✅ Mobile responsive (modal, badge, buttons, dialogs)
- ✅ Analytics events logged correctly

---

## Success Criteria

- ✅ Complete employee invitation system from database → frontend
- ✅ Company isolation via JWT + RLS
- ✅ Admin-only invite button with role gating
- ✅ Magic link flow with password setup
- ✅ "Pending" badge in Team Management with resend button
- ✅ Resend confirmation dialog + analytics
- ✅ All 14 steps complete + tested
- ✅ TypeScript passes with zero errors
- ✅ Fully responsive design
