type SupabaseAuthUser = {
  id: string;
  email?: string | null;
};

type SupabaseAdminAuth = {
  auth: {
    admin: {
      listUsers(input: { page: number; perPage: number }): Promise<{
        data: { users?: SupabaseAuthUser[] } | null;
        error: Error | null;
      }>;
      updateUserById(id: string, input: { email?: string; password: string; email_confirm?: boolean }): Promise<{
        data: { user?: SupabaseAuthUser | null };
        error: Error | null;
      }>;
      createUser(input: { email: string; password: string; email_confirm: boolean }): Promise<{
        data: { user?: SupabaseAuthUser | null };
        error: Error | null;
      }>;
    };
  };
};

export type InviteExistingUserForAuth = {
  id: string;
  supabaseId: string | null;
};

export async function findSupabaseAuthUserByEmail(
  supabase: SupabaseAdminAuth,
  email: string,
) {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const matchedUser = users.find(
      (candidate) => candidate.email?.trim().toLowerCase() === email,
    );

    if (matchedUser) {
      return matchedUser;
    }

    if (users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function resolveInviteAcceptanceAuthUser(input: {
  supabase: SupabaseAdminAuth;
  existingUser: InviteExistingUserForAuth | null;
  inviteEmail: string;
  password: string;
}) {
  const { supabase, existingUser, inviteEmail, password } = input;
  const authUserId = existingUser?.supabaseId
    ?? (await findSupabaseAuthUserByEmail(supabase, inviteEmail))?.id
    ?? null;

  if (authUserId) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      authUserId,
      {
        email: inviteEmail,
        password,
        email_confirm: true,
      },
    );

    if (error || !data.user) {
      throw error ?? new Error("Failed to reset password.");
    }

    return {
      supabaseUserId: data.user.id,
      createdAuthUser: false,
    };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: inviteEmail,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new Error("Failed to create authentication account.");
  }

  return {
    supabaseUserId: data.user.id,
    createdAuthUser: true,
  };
}
