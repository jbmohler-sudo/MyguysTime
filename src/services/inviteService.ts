import { createInvite, listInvites, resendInvite, revokeInvite } from "../lib/api";
import type { InviteInput, InviteSummary } from "../domain/models";

// Thin service layer wrapping the existing API functions.
// Provides a named import point for components that prefer service abstraction.

let _token: string | null = null;

export function setInviteServiceToken(token: string | null) {
  _token = token;
}

function getToken(): string {
  if (!_token) throw new Error("Not authenticated");
  return _token;
}

export const inviteService = {
  async createInvite(payload: InviteInput): Promise<{ invite: InviteSummary; inviteUrl?: string }> {
    return createInvite(getToken(), payload);
  },

  async resendInvite(inviteId: string): Promise<{ invite: InviteSummary }> {
    return resendInvite(getToken(), inviteId);
  },

  async revokeInvite(inviteId: string): Promise<{ ok: boolean }> {
    return revokeInvite(getToken(), inviteId);
  },

  async getInvitesByCompany(): Promise<InviteSummary[]> {
    const result = await listInvites(getToken());
    return result.invites;
  },
};
