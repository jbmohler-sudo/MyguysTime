# Credential Rotation Reminder — Action Required

**Generated:** 2026-06-27 (scheduled task)

The git filter-repo rewrite on June 25 successfully removed `.env.production.vercel` and `.env.production.tmp` from all 136 commits, and the cleaned history has been force-pushed. However, the secrets were exposed on GitHub and **must be rotated** to fully neutralize the leak. Until that's done, anyone who previously cloned or scraped the repo still has access to the old values.

Backup bundle: `c:\Umbrella\MyGuysTime-backup-pre-filter-20260625.bundle`

---

## 1. Neon — Reset database password (CRITICAL)

- **Project:** `raspy-forest-23434318`
- **Action:** Reset the `neondb_owner` password in the Neon console
- **Then:** Update the new connection string / password in Vercel environment variables (all environments that reference it)

## 2. Supabase — Roll the JWT secret (CRITICAL)

- **Project:** `ufbanjchatwkheaqafsf`
- **Action:** Roll the JWT secret in Supabase Dashboard → Settings → API → JWT Secret
- **Effect:** This invalidates both the **service-role key** and the **anon key**
- **Then:** Re-copy both new keys into Vercel environment variables
- **Note:** Any running server instances will need to be redeployed with the new keys

## 3. GitHub — Request early GC (optional)

- Contact GitHub Support and request early garbage collection on the repo so the old unreachable commits containing secrets are purged sooner than the default ~90-day window.

---

**This file can be deleted once all rotation steps are complete.**
