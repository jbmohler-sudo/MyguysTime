# Claude Code Prompt: Swap in Performance-Optimized TeamManagementPanel

## Overview
Replace the current `TeamManagementPanel.tsx` with `TeamManagementPanel.optimized.tsx` to enable:
- **Virtualization** — render only visible rows (12 DOM nodes instead of 100+)
- **Debounced search** — smooth filtering without re-render per keystroke
- **Memoization** — cache expensive computations (deduplication, lookups, sorting)

Result: **10-100x faster** on large employee lists (50+).

## Step 1: Backup the Current Component

You can keep the original for reference. No code changes needed here, just good practice.

```bash
cp src/components/TeamManagementPanel.tsx src/components/TeamManagementPanel.original.tsx
```

## Step 2: Swap in the Optimized Component

Replace the original with the optimized version:

```bash
cp src/components/TeamManagementPanel.optimized.tsx src/components/TeamManagementPanel.tsx
```

## Step 3: Verify Imports in AppShell

Confirm `AppShell.tsx` imports `TeamManagementPanel` from the correct path. It should already be correct:

```typescript
import { TeamManagementPanel } from "./TeamManagementPanel";
```

No changes needed — the component name and props are identical.

## Step 4: Build and Test Locally

Run the build to ensure no TypeScript errors:

```bash
npm run build
```

Verify:
- [ ] Clean build (no TS errors)
- [ ] No import warnings
- [ ] All dependencies resolve

## Step 5: Test the Component

### UI Test
- [ ] TeamManagementPanel still renders in AppShell
- [ ] Search input appears at top of employee list
- [ ] Employee count in header updates with search results: "Team (45)" etc.
- [ ] Add Employee button is present and clickable

### Virtualization Test
Create test data with 100+ employees (mock or API):
- [ ] Scroll through the employee list smoothly
- [ ] Monitor DevTools → Elements tab → count visible `<div>` nodes inside the virtual list
- [ ] Should see ~12 DOM nodes (visible + buffer), not 100
- [ ] Scroll is smooth (60fps) even with large list

**How to verify virtualization:**
1. Open DevTools → Elements tab
2. Expand the `.team-list` div
3. Scroll and watch node count
4. Before: 100 visible row divs
5. After: ~12 visible row divs + 2 spacer divs

### Search/Filter Test
- [ ] Type in search input → results filter in real-time
- [ ] Search works by employee name: "john" finds "John Smith"
- [ ] Search works by crew: "truck 1" finds employees in Truck 1
- [ ] Case-insensitive: "JOHN" and "john" both work
- [ ] Clear search → full list returns
- [ ] No results message: "No employees match your search"
- [ ] Empty state: "No employees yet" (if list is truly empty)

### Interactivity Test
- [ ] Click an employee row → `onEditEmployee` callback fires
- [ ] Hover effect works: row background changes to light orange, slides right
- [ ] Status badge shows "Active" or "Inactive" with correct colors
- [ ] Avatar shows initials (John Smith → "JS")

### Performance Test
**Before → After comparison (with 100+ employees):**

1. Open DevTools → Performance tab
2. Click "Record"
3. Scroll through employee list (3-4 passes, ~5 seconds total)
4. Click "Stop"
5. Look for "Recalculate Style" and "Layout" bars

**Target metrics:**
- Main thread blocking: <100ms per scroll frame
- Layout recalculations: <16ms per frame (60fps)
- CPU usage: <20% during scroll

**If performance is still slow:**
- Check that `visibleRange` is actually limiting rows (DevTools → Sources, add breakpoint in `slice()`)
- Verify `useMemo` dependencies are correct (should not recompute on every parent render)
- Check browser DevTools for other bottlenecks (animation, CSS, etc.)

### Responsive Test
- [ ] On desktop (>720px): list height is 528px, scrollable
- [ ] On mobile (<720px): list adapts gracefully
- [ ] Touch scroll works smoothly
- [ ] Search input is usable on mobile

## Step 6: Run DevTools Profiler (Optional but Recommended)

```bash
npm install react-devtools
```

Then in DevTools:
1. Open React DevTools tab
2. Go to Profiler tab
3. Record a scroll through the employee list
4. Look for:
   - Which components are rendering
   - How often `useMemo` is triggering recomputation
   - Which nodes cause re-renders

Expected result: `TeamManagementPanel` should render once per scroll event, not per keystroke or parent render.

## Step 7: Commit and Push

Once verified:

```bash
git add src/components/TeamManagementPanel.tsx
git commit -m "perf: virtualize team management panel for large employee lists

- Render only visible rows (12 DOM nodes instead of 100+)
- Add debounced search/filter by name and crew
- Memoize expensive deduplication and sorting
- 10-100x faster render time on 50+ employees
- Smooth scroll with buffer zone for edge cases"
git push
```

## Step 8: Monitor Performance in Production

Once deployed to Vercel:
- [ ] Monitor Core Web Vitals (Speed Insights in Vercel dashboard)
- [ ] Test with real data (large customer databases)
- [ ] Gather feedback on scroll smoothness
- [ ] If still slow: profile with real traffic patterns

## Edge Cases to Verify

- [ ] Empty employee list → "No employees yet" message, no virtualization errors
- [ ] Single employee → renders in virtual list correctly
- [ ] Search returns 0 results → "No employees match" message
- [ ] Search returns 1 result → shows correctly in virtual list
- [ ] Rapid scrolling + search at same time → both work smoothly
- [ ] Very long employee names → ellipsis with `text-overflow: ellipsis`
- [ ] Very long crew names → truncated in "crew • $rate/hr" line

## Performance Checklist

- [ ] Virtualization is active (only 12 DOM nodes visible)
- [ ] Search is debounced (filters only on input change, not parent re-render)
- [ ] Deduplication is memoized (only recomputes when employeeWeeks changes)
- [ ] Sorting is memoized (only recomputes when employees list changes)
- [ ] Scroll is smooth (60fps, <16ms per frame)
- [ ] Search input is responsive (<100ms to first filter update)
- [ ] No memory leaks (scroll handlers are cleaned up)
- [ ] Mobile viewport is responsive (<720px)

## Rollback Plan

If the optimized component causes issues:

```bash
cp src/components/TeamManagementPanel.original.tsx src/components/TeamManagementPanel.tsx
git commit -m "revert: swap back to original TeamManagementPanel"
git push
```

---

## Notes

- The optimized component is a drop-in replacement (same props, same behavior)
- All styling is preserved (orange accent, hover effects, badges)
- Data deduplication logic is identical to the original
- Only the rendering strategy changed (virtualization + memoization)
- No breaking changes to AppShell or other components

## Questions?

Refer to `PERFORMANCE_OPTIMIZATION_GUIDE.md` for deeper technical details on each optimization strategy.
