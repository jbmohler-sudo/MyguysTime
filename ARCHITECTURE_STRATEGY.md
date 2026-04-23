# MyGuysTime Architecture Strategy

## Multi-Tenant Scaling Philosophy

Build for **small contractors first, scale to large enterprises** without major rewrites.

---

## 1. Data Architecture: Centralized Active Status

### Why ManagedEmployee, Not EmployeeWeek?

**EmployeeWeek** = Transactional (weekly snapshots)
- Changes every week
- Status is temporary and contextual
- Not the right place for master employee data

**ManagedEmployee** = Master Record (single source of truth)
```typescript
interface ManagedEmployee {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  workerType: "employee" | "contractor_1099";
  hourlyRate: number;
  active: boolean;              // ← Centralized active flag
  defaultCrewId: string | null;
  defaultCrewName: string | null;
  hasLoginAccess: boolean;
}
```

### Benefits:
- **Data Consistency**: One source of truth prevents contradictions
- **Historical Accuracy**: Archived employees stay on record with context
- **Small Crews**: Easy toggle for seasonal workers (1-click activate/deactivate)
- **Large Firms**: Bulk operations on employee roster (import/export, batch updates)

### Implementation:
- Store `active` on ManagedEmployee master record
- EmployeeWeek references ManagedEmployee via employeeId
- Timesheet view automatically filters by `active: true`
- Archive/reactivate flow doesn't touch historical transactional data

---

## 2. Logical Data Isolation: Multi-Tenant Architecture

### Tenant-Based Security Model

```typescript
// Every entity includes companyId
interface ManagedEmployee {
  id: string;
  companyId: string;  // ← CRITICAL: Tenant identifier
  firstName: string;
  // ...
}

interface EmployeeWeek {
  id: string;
  companyId: string;  // ← Must match viewer's companyId
  employeeId: string;
  // ...
}

interface CrewSummary {
  id: string;
  companyId: string;  // ← Must match viewer's companyId
  name: string;
  // ...
}
```

### Enforcement Rules:
1. **Query Filtering**: Every API call must include `WHERE companyId = ?`
   ```sql
   SELECT * FROM managed_employees 
   WHERE companyId = $1 AND active = true
   ```

2. **Frontend Validation**: Viewer's companyId must match payload data
   ```typescript
   if (data.viewer.companyId !== data.crews[0].companyId) {
     throw new Error("Tenant mismatch: Access denied");
   }
   ```

3. **No Global Queries**: Never fetch employees without filtering by tenant
   ```typescript
   // ❌ WRONG
   const allEmployees = await fetch('/api/employees');
   
   // ✅ RIGHT
   const myEmployees = await fetch(`/api/companies/${companyId}/employees`);
   ```

### Cost Model:
- **Small Contractors**: One company, one admin = minimal overhead
- **Multi-tenant Efficiency**: Shared database eliminates infrastructure duplication
- **Enterprise**: Can still white-label or host separately if needed

---

## 3. Role-Based Access Control (RBAC)

### Permission Model

```typescript
type UserRole = "admin" | "foreman" | "employee";

interface ViewerPermissions {
  canManageTeam: boolean;        // Create/edit employees
  canApproveTimesheets: boolean; // Sign off on hours
  canExportPayroll: boolean;     // Generate payroll files
  canViewReports: boolean;       // Access analytics/history
  canAccessCrews: CrewId[];      // Crew-level restrictions
}

// Derive permissions from role
const getPermissions = (viewer: Viewer): ViewerPermissions => {
  if (viewer.role === "admin") {
    return {
      canManageTeam: true,
      canApproveTimesheets: true,
      canExportPayroll: true,
      canViewReports: true,
      canAccessCrews: ["all"], // Access all crews
    };
  }
  
  if (viewer.role === "foreman") {
    return {
      canManageTeam: false,
      canApproveTimesheets: true,
      canExportPayroll: false,
      canViewReports: false,
      canAccessCrews: [viewer.assignedCrewId], // Only their crew
    };
  }
  
  if (viewer.role === "employee") {
    return {
      canManageTeam: false,
      canApproveTimesheets: false,
      canExportPayroll: false,
      canViewReports: false,
      canAccessCrews: [viewer.assignedCrewId], // View own crew only
    };
  }
};
```

### For Mid/Large Contractors:
Future expansion to crew-level permissions:
```typescript
type UserRole = "admin" | "crew_admin" | "foreman" | "employee";

// Admin for Crew 1, Foreman for Crew 2
interface CrewPermission {
  crewId: string;
  role: "admin" | "foreman" | "viewer";
}

interface User {
  id: string;
  defaultRole: UserRole;
  crewPermissions: CrewPermission[]; // ← Multi-crew access with different roles
}
```

---

## 4. Feature Segmentation by Contractor Size

### Small Crews (1-5 people) — Simplicity First

**Core Features:**
- ✅ Mobile-first time entry (web form, no app download)
- ✅ Simple weekly timesheet (no complexity)
- ✅ One-click payroll export (CSV for payroll service)
- ✅ Basic crew management (add/remove workers)

**Optional Upsell Features:**
- GPS geofencing (verify work location)
- Photo evidence (take photo at job site)
- Job site tagging (simple dropdown of locations)

**UI/UX:**
- Bottom nav (truck mode) for mobile dominance
- Large buttons, minimal text
- Voice input for hours (accessibility)

---

### Mid-Size Contractors (10-50 people) — Oversight & Control

**Added Features:**
- ✅ Supervisor approval workflows (foreman approves, office locks)
- ✅ Task-level time coding (hours by job, not just totals)
- ✅ Multi-crew scheduling (visual crew schedules)
- ✅ Bulk time adjustments (office admin fixes errors)
- ✅ Weekly payroll reports (aggregate by crew, by job)

**Optional Upsell Features:**
- QuickBooks integration (auto-sync payroll)
- Slack notifications (alerts for missing time)
- Email reminders (automated follow-ups to foremen)

**UI/UX:**
- Sidebar (office mode) for power users
- Role-based dashboard (admin sees different view than foreman)
- Bulk operations (select multiple employees, batch actions)

---

### Large Contractors (50+ people) — Enterprise Integration

**Added Features:**
- ✅ Advanced RBAC (crew admins, department permissions)
- ✅ ERP/Accounting integrations (Gusto, ADP, NetSuite)
- ✅ Custom field support (contractor-specific data)
- ✅ Audit trails (who changed what, when)
- ✅ API access (contractors build custom workflows)
- ✅ Advanced reporting (analytics, dashboards, forecasting)
- ✅ Offline-first sync (works without internet)

**Optional Features:**
- White-label support (custom branding)
- Self-hosted option (on-premise deployment)
- SLA guarantees (enterprise support)

**UI/UX:**
- Customizable dashboards
- Advanced filtering & search
- Keyboard shortcuts for power users
- Dark mode (for all-day admins)

---

## 5. Field-Reliant Features: Offline-First Design

### The Problem:
Crews work in remote locations without reliable internet. Offline functionality is **required for all contractors**, not optional.

### Solution: Offline Queue + Auto-Sync

```typescript
// When offline, queue changes locally
interface OfflineQueue {
  id: string;
  action: "update_day" | "submit_timesheet" | "create_employee";
  payload: any;
  timestamp: number;
  synced: false;
}

// When online, sync in order
const syncQueue = async (queue: OfflineQueue[]) => {
  for (const item of queue) {
    try {
      await api.submitAction(item.action, item.payload);
      markSynced(item.id);
    } catch (error) {
      // Retry on next connection
      logError(item.id, error);
    }
  }
};
```

### Implementation Phases:

**Phase 1 (MVP):** Browser offline detection + localStorage queue
- Works for single-device usage
- Syncs when internet returns
- Good enough for small crews

**Phase 2 (Scale):** Service Worker + IndexedDB
- Reliable offline queue persistence
- Background sync (even if app closes)
- Required for mid-size contractors

**Phase 3 (Enterprise):** Full sync engine (Watermelon DB, WatermelonSync)
- Multi-device offline-first
- Real-time sync protocol
- Enterprise-grade reliability

---

## 6. Implementation Roadmap

### MVP (Current - Weeks 1-4)
- ✅ Single tenant, single company
- ✅ Basic RBAC (admin/foreman/employee)
- ✅ ManagedEmployee active flag
- ✅ Mobile-first UI (truck mode)
- ✅ Simple payroll export

### Scaling Phase (Weeks 5-8)
- ✅ Multi-tenant data isolation (companyId everywhere)
- ✅ Mid-size features (crew-level approval, task coding)
- ✅ Offline queue + sync
- ✅ Email/Slack notifications

### Enterprise Phase (Weeks 9+)
- ✅ Advanced RBAC (crew-level permissions)
- ✅ Third-party integrations (QuickBooks, etc.)
- ✅ Custom fields & workflows
- ✅ API access for contractors

---

## 7. Data Security Checklist

Before launching multi-tenant:

- [ ] Every table has `companyId` column
- [ ] Every API endpoint filters by `viewer.companyId`
- [ ] Frontend validates `data.viewer.companyId` matches payload data
- [ ] No cross-company queries possible (even with SQL injection)
- [ ] Audit logging for sensitive operations
- [ ] Role-based UI hiding (don't show buttons user can't use)
- [ ] Test with two fake companies to verify isolation

---

## 8. Key Takeaways

1. **Use ManagedEmployee for active status** — master record, not transactional
2. **Enforce companyId everywhere** — multi-tenant foundation
3. **RBAC first, granular later** — simple roles now, crew-level permissions when scaling
4. **Offline-first from day 1** — field work requires it
5. **Build features in tiers** — small crews now, large enterprises later

This approach lets you:
- Launch quickly (small contractors only)
- Scale cleanly (add tenants without breaking existing ones)
- Expand features (upsell to larger contractors)
- Maintain security (data isolation enforced at DB level)

