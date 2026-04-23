# Claude Code Setup Prompt: Full AppShell Redesign + Team Panel Integration

## Overview
You're redesigning the entire MyGuysTime dashboard to match modern SaaS standards with orange branding, professional styling, and the new Team Management Panel. This is a **comprehensive visual refresh** of the app shell while preserving all functionality.

## Current State
- ✅ `src/components/TeamManagementPanel.tsx` exists (modern employee list)
- ⚠️ `AppShell.tsx` uses old styling (needs complete visual refresh)
- ⚠️ No orange branding applied to header, nav, buttons
- ⚠️ No modern hover effects, transitions, shadows
- ⚠️ No responsive design refinement for truck/office modes

## Design System (Brand Constants)

Use these throughout the redesign:

```typescript
const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";
const BRAND_LIGHT = "#F8F9FA";
const ACCENT_TEAL = "#00BCD4";
const STATUS_GREEN = "#4CAF50";
const STATUS_GRAY = "#9E9E9E";
```

Colors:
- **Orange (#FF8C00)** — Primary CTA, active states, alerts, accents
- **Dark (#1A1A1B)** — Text, headings, dark backgrounds
- **Light (#F8F9FA)** — Page background, card backgrounds
- **Teal (#00BCD4)** — Secondary accents, "today" indicators
- **Green (#4CAF50)** — Success states, approved status
- **Gray (#9E9E9E)** — Inactive/disabled states

Typography:
- **Headings:** Poppins 600/700 weight, bold geometric feel
- **Body:** Inter 400/500 weight, clean & readable
- **Monospace:** Fira Code for hours/numbers

---

## What Needs to Change: AppShell.tsx

### 1. Header (.hero) Redesign

**Current:** Basic layout with minimal styling
**New:** Modern sticky header with:
- Gradient background (light gray to white)
- Orange bottom border (3px)
- Better spacing and alignment
- Hover effects on nav items
- Active state underline (orange)

```tsx
// Header should look like:
<header className="hero hero--app" style={{
  backgroundColor: BRAND_LIGHT,
  borderBottom: `3px solid ${BRAND_ORANGE}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}}>
```

### 2. Navigation Items

**Current:** Plain button styling
**New:** Modern nav with:
- Underline animation on active state (orange)
- Hover background color
- Smooth transitions
- Better visual hierarchy

```tsx
// Active nav item should have:
style={{
  borderBottom: `2px solid ${BRAND_ORANGE}`,
  color: BRAND_ORANGE,
  fontWeight: 700,
  transition: 'all 0.2s ease'
}}
```

### 3. Mode Pill

**Current:** Basic text
**New:** Orange-branded badge with:
- Orange background for office mode
- Teal background for truck mode
- White text
- Rounded corners
- Box shadow

```tsx
style={{
  backgroundColor: uiMode === "office" ? BRAND_ORANGE : ACCENT_TEAL,
  color: 'white',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '0.75rem',
  fontWeight: 800,
  boxShadow: `0 2px 6px rgba(0,0,0,0.1)`
}}
```

### 4. Error Banner

**Current:** Plain red/error styling
**New:** Orange-themed alert banner with:
- Orange left border (4px)
- Light orange background
- Dark text
- Professional appearance

```tsx
style={{
  backgroundColor: 'rgba(255, 140, 0, 0.1)',
  borderLeft: `4px solid ${BRAND_ORANGE}`,
  color: BRAND_DARK,
  padding: '16px 20px',
  borderRadius: '4px'
}}
```

### 5. Mode Banner

**Current:** Basic section with text
**New:** Styled info banner with:
- Light background
- Orange accent border or text
- Clear typography hierarchy
- Subtle shadow

```tsx
style={{
  backgroundColor: '#F0F0F0',
  borderLeft: `4px solid ${BRAND_ORANGE}`,
  padding: '16px 20px',
  borderRadius: '8px',
  marginBottom: '24px'
}}
```

### 6. Main Content Grid

**Current:** Basic CSS grid
**New:** Refined grid with:
- Proper spacing/gaps
- Background color
- Responsive breakpoints (desktop sidebar vs mobile bottom nav)
- Smooth transitions

---

## What Needs to Change: Specific Components

### Buttons
- All buttons should use `BRAND_ORANGE` for primary actions
- Add hover effects (lift: `translateY(-2px)`, shadow expand)
- Add transitions (0.2s ease)
- Maintain size for touch targets (min 44px height)

### Input Fields
- Border: `2px solid #EEE`
- Focus state: `2px solid ${BRAND_ORANGE}` with subtle orange glow
- Border radius: `8px`
- Padding: `12px`

### Cards
- Background: white
- Shadow: `0 2px 8px rgba(0,0,0,0.05)`
- Border radius: `12px`
- Hover: shadow expand, slight lift

### Status Indicators
- Draft: Gray (#9E9E9E)
- Submitted: Teal (#00BCD4)
- Approved: Green (#4CAF50)
- Locked: Dark (#1A1A1B)

---

## Implementation Steps

### STEP 1: Update Imports & Colors
At the top of AppShell.tsx, add color constants:
```typescript
const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";
const BRAND_LIGHT = "#F8F9FA";
const ACCENT_TEAL = "#00BCD4";
const STATUS_GREEN = "#4CAF50";
const STATUS_GRAY = "#9E9E9E";
```

### STEP 2: Redesign Header
Update `<header className="hero hero--app">` with:
- Light background
- Orange bottom border (3px)
- Sticky positioning
- Proper spacing

### STEP 3: Redesign Navigation
Update nav item styles:
- Active state: orange underline + orange text
- Hover: subtle background color
- Transitions on all state changes

### STEP 4: Update Mode Pill
Style based on `uiMode`:
- Office mode: BRAND_ORANGE background
- Truck mode: ACCENT_TEAL background
- White text, rounded corners

### STEP 5: Update Error Banner
Apply orange-themed styling

### STEP 6: Update Main Content Area
Apply proper spacing, backgrounds, shadows

### STEP 7: Integrate TeamManagementPanel
When `activePage === "team"` renders, pass:
```tsx
<TeamManagementPanel
  data={data}
  onOpenAddEmployee={() => setShowAddEmployeeModal(true)}
  onEditEmployee={(employee) => {
    console.log("Edit employee:", employee);
  }}
/>
```

### STEP 8: Add Modal State
Add to useState calls:
```typescript
const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
```

---

## Specific Visual Changes Checklist

- [ ] Header has orange bottom border (3px) and light background
- [ ] Header is sticky (position: sticky, top: 0, z-index: 100)
- [ ] Nav items show orange underline when active
- [ ] Nav items change color on hover
- [ ] Mode pill is orange (office) or teal (truck) with white text
- [ ] Error banner has orange left border and light orange background
- [ ] All buttons use BRAND_ORANGE for primary actions
- [ ] All buttons have hover effects (lift + shadow)
- [ ] All input fields have 2px border with rounded corners
- [ ] All cards have subtle shadows and hover effects
- [ ] Team panel displays when activePage === "team"
- [ ] "ADD NEW GUY" button clicks without errors
- [ ] All text is readable with proper contrast

---

## Testing Checklist

### Visual
1. Navigate to each page (Dashboard, Team, Company Settings, Archive)
2. Verify header styling is consistent
3. Verify nav active state matches current page
4. Check hover effects on buttons and cards
5. Verify mode pill color (office = orange, truck = teal)
6. Check error banner appearance (if error exists)

### Functionality
1. All nav buttons navigate correctly
2. Sign out button works
3. Team page displays employee list
4. "ADD NEW GUY" button doesn't error
5. "Edit Profile" button doesn't error
6. No console errors

### Responsive
1. Desktop (1024px+): All elements visible
2. Tablet (768px-1023px): Layout adapts
3. Mobile (< 768px): Hamburger menu works, truck mode applies

---

## Files to Update

Only ONE main file needs changes:
- `src/components/AppShell.tsx` — Complete visual refresh

Files that should NOT change:
- `src/components/TeamManagementPanel.tsx` — Keep as-is
- Other components — Keep as-is
- `src/domain/models.ts` — Keep as-is

---

## Success Criteria

When done, the app should look like:
- ✅ Modern SaaS dashboard with professional styling
- ✅ Orange branding consistent throughout
- ✅ Smooth transitions and hover effects
- ✅ Team Management Panel visible and functional
- ✅ No console errors
- ✅ Responsive on desktop, tablet, mobile
- ✅ All original functionality preserved

---

## Architecture Context

This is part of a larger redesign. See `ARCHITECTURE_STRATEGY.md` and `DATA_SCHEMA_MAPPING.md` for full context.

Key points:
- Using `data.employeeWeeks` as employee source
- Multi-tenant support will come later
- This is Phase 1 (MVP) of a 3-phase rollout
- Focus on visual polish and core workflows

---

## Questions to Answer If Issues Arise

1. Are colors not applying? Check if color constants are defined at top of file
2. Is header not sticky? Verify position: sticky and z-index: 100
3. Are nav items not styled correctly? Check active state logic and inline styles
4. Is Team panel not showing? Verify import and activePage === "team" condition
5. Any TypeScript errors? Check that all prop types match

---

## Expected Result

After completion, you should see:
- Professional orange-branded dashboard
- Modern styling throughout header and nav
- Smooth animations and hover effects
- Team Management Panel displays correctly
- All pages navigate without errors
- Ready for next phase (Add Employee Modal)

Report back with:
1. Screenshot of each page (Dashboard, Team, Company Settings, Archive)
2. Any console errors (paste them)
3. Any styling issues or missing elements
4. Confirmation that Team panel displays employee list

Good luck! This is a comprehensive redesign but well-scoped. Claude Code should be able to handle it cleanly.
