# Seed Data Fixes - Phase 2 CompanyId Addition

## Problem
The seed.ts script needs to include `companyId` for all Crew and Employee creation calls to match the Phase 2 database schema. Due to network sandbox restrictions, these fixes could not be pushed to origin/main.

## Solution
Apply the patch file: `seed-fixes.patch`

### Steps to Apply
```bash
# From the repo root
git apply seed-fixes.patch
# Or manually review and apply the changes shown in seed-fixes.patch
```

### What Changed
All Crew and Employee creation calls in `prisma/seed.ts` now include `companyId: company.id`:
- Line 217: Masonry Crew creation
- Line 221: Roofing Crew creation  
- Lines 225, 239, 254, 269: All four employee creations (Luis, Marco, Troy, Evan)

### Local Commit
These fixes are committed locally as commit `202214f` and exist in the working tree.

### Testing
Once applied, seed data can be generated with:
```bash
npm run db:seed
```

This will populate test crews and employees with proper company scoping.
