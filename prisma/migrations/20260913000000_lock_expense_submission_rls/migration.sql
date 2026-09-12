-- ExpenseSubmission was added after the April RLS sweep and never locked down.
ALTER TABLE "ExpenseSubmission" ENABLE ROW LEVEL SECURITY;

-- PostgREST roles must not retain table privileges. The API uses Prisma over
-- the direct database connection, which does not depend on these grants.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "ExpenseSubmission" FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "ExpenseSubmission" FROM authenticated;
  END IF;

  REVOKE ALL ON TABLE "ExpenseSubmission" FROM PUBLIC;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE "ExpenseSubmission" TO service_role;
  END IF;
END
$$;
