import assert from "node:assert/strict";
import { resolveInviteAcceptanceAuthUser } from "../dist-server/server/routes/inviteAuthResolution.js";

function createMockSupabase(users = []) {
  const calls = {
    listUsers: [],
    updateUserById: [],
    createUser: [],
  };

  return {
    calls,
    client: {
      auth: {
        admin: {
          async listUsers(input) {
            calls.listUsers.push(input);
            return { data: { users }, error: null };
          },
          async updateUserById(id, input) {
            calls.updateUserById.push({ id, input });
            return {
              data: {
                user: {
                  id,
                  email: input.email,
                },
              },
              error: null,
            };
          },
          async createUser(input) {
            calls.createUser.push(input);
            return {
              data: {
                user: {
                  id: "auth-created-1",
                  email: input.email,
                },
              },
              error: null,
            };
          },
        },
      },
    },
  };
}

{
  const mock = createMockSupabase();
  const result = await resolveInviteAcceptanceAuthUser({
    supabase: mock.client,
    existingUser: {
      id: "prisma-user-1",
      supabaseId: "auth-user-1",
    },
    inviteEmail: "worker@example.com",
    password: "invitepass123",
  });

  assert.equal(result.supabaseUserId, "auth-user-1");
  assert.equal(result.createdAuthUser, false);
  assert.deepEqual(mock.calls.updateUserById.map((call) => call.id), ["auth-user-1"]);
  assert.equal(mock.calls.createUser.length, 0);
  assert.equal(mock.calls.listUsers.length, 0);
}

{
  const mock = createMockSupabase([
    { id: "auth-by-email-1", email: "reactivate@example.com" },
  ]);
  const result = await resolveInviteAcceptanceAuthUser({
    supabase: mock.client,
    existingUser: {
      id: "prisma-user-2",
      supabaseId: null,
    },
    inviteEmail: "reactivate@example.com",
    password: "invitepass123",
  });

  assert.equal(result.supabaseUserId, "auth-by-email-1");
  assert.equal(result.createdAuthUser, false);
  assert.deepEqual(mock.calls.updateUserById.map((call) => call.id), ["auth-by-email-1"]);
  assert.equal(mock.calls.createUser.length, 0);
}

{
  const mock = createMockSupabase();
  const result = await resolveInviteAcceptanceAuthUser({
    supabase: mock.client,
    existingUser: null,
    inviteEmail: "new-worker@example.com",
    password: "invitepass123",
  });

  assert.equal(result.supabaseUserId, "auth-created-1");
  assert.equal(result.createdAuthUser, true);
  assert.equal(mock.calls.updateUserById.length, 0);
  assert.deepEqual(mock.calls.createUser.map((call) => call.email), ["new-worker@example.com"]);
}

console.log("invite auth resolution tests passed");
