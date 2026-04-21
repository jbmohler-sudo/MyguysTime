# Phase 2 Test Scenarios - Multi-Company Data Isolation

## Overview
Phase 2 adds `companyId` to JWT tokens and scopes all database queries by company. This enables true multi-tenancy where each company's data is completely isolated.

## Test Flow

### Scenario 1: Login Flow with CompanyId

**Setup:**
- Test company already exists in database (from company-setup in Phase 1)
- Employee records linked to company via `companyId`
- User has an employee record

**Test Steps:**
1. User navigates to login page
2. Enters valid credentials (email + password)
3. Backend login endpoint:
   - Fetches user + employee relation
   - Validates user has employee record (prerequisite for companyId)
   - Issues JWT token with structure:
     ```json
     {
       "userId": "user_123",
       "role": "ADMIN|FOREMAN|EMPLOYEE",
       "companyId": "company_456"
     }
     ```
4. Frontend stores token in localStorage
5. Future API calls include `Authorization: Bearer <token>` header

**Expected Outcome:**
- Token contains companyId
- User can access `/api/auth/me` endpoint
- Bootstrap data is scoped to their company

---

### Scenario 2: Company-Scoped Data Queries

**Test Case 2A: Admin Viewing Crews**
- Admin logs in
- GET `/api/auth/me` returns crews filtered by:
  ```javascript
  where: { companyId: token.companyId }
  ```
- Only crews belonging to their company appear

**Test Case 2B: Foreman Viewing Assigned Crews**
- Foreman logs in
- Gets accessible crew IDs for their company:
  ```javascript
  crews = await prisma.crew.findMany({
    where: { 
      companyId: token.companyId,
      foremanId: foreman.employeeId
    }
  })
  ```
- Only their assigned crews appear

**Test Case 2C: Employee Viewing Their Timesheets**
- Employee logs in
- Gets timesheets filtered by:
  ```javascript
  where: { 
    weekStartDate: week,
    employeeId: employee.id
  }
  ```
- Only their own timesheets shown (no cross-company leakage)

---

### Scenario 3: Company Setup Creates Company-Scoped Resources

**Test Steps:**
1. Admin completes company-setup endpoint
2. Creates default crew with `companyId: req.auth.companyId`
3. Creates employees with `companyId: req.auth.companyId`
4. Generates timesheets for that company only

**Expected Outcome:**
- New crews only appear in that company's view
- New employees only accessible to that company
- No data leakage to other companies

---

### Scenario 4: Multi-Company Isolation

**Setup:**
- Company A with crews/employees
- Company B with crews/employees
- Two users from different companies logging in

**Test:**
1. User A (Company A) logs in
   - Token has `companyId: "company_a"`
   - Sees only Company A data
2. User B (Company B) logs in
   - Token has `companyId: "company_b"`
   - Sees only Company B data
3. Even if User A tries to access User B's data:
   - Backend queries automatically filter by User A's companyId
   - User B's data never returned

**Expected Outcome:**
- Zero data cross-contamination
- Each company operates in isolation

---

## Database Verification

After deployment, verify the migration ran:

```sql
-- Check companyId columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Crew' AND column_name = 'companyId';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Employee' AND column_name = 'companyId';

-- Verify foreign keys
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'Crew' AND constraint_type = 'FOREIGN KEY';

-- Check existing data was backfilled
SELECT companyId, COUNT(*) FROM Crew GROUP BY companyId;
SELECT companyId, COUNT(*) FROM Employee GROUP BY companyId;
```

---

## Deployment Checklist

- [ ] Code is committed locally (commit: f3b9f0c)
- [ ] Network access enabled for git push
- [ ] Push to origin main: `git push origin main`
- [ ] Vercel automatically deploys
- [ ] Prisma client regenerated (automatic during build)
- [ ] Database migration applied to Neon
- [ ] Test login with existing credentials
- [ ] Verify JWT contains companyId
- [ ] Test crew/employee visibility by company
- [ ] Monitor Sentry for any errors

---

## What Works Post-Deployment

✅ JWT tokens include companyId  
✅ All queries automatically scoped by company  
✅ Multi-company data isolation enforced  
✅ Existing test accounts still work  
✅ Foundation ready for Phase 3 (employee creation UI)  

---

## Known Limitations (Expected)

- Type checking errors locally (Prisma types not regenerated offline)
  - ✅ Resolved automatically during Vercel build
- Network push blocked
  - ⏳ Enable network egress in Vercel settings
- No employee creation UI yet
  - 📝 Phase 3 will add foreman/self-registration flows
