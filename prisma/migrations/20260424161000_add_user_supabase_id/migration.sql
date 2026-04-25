-- Add optional Supabase Auth identity linkage without breaking existing local users.
ALTER TABLE "User" ADD COLUMN "supabaseId" UUID;

CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");
