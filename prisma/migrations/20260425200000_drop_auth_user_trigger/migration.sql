-- Drop the broken auth trigger that fires on auth.users INSERT.
-- The trigger tried to insert a "User" row without companyId (NOT NULL),
-- which caused every supabase.auth.signUp() call to fail with
-- "Database error saving new user".
-- User creation is handled by the POST /api/auth/signup route instead.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
