# Task System Fix - Individual Submissions Until Deadline

## Problem
When a Head created a task for their department, tasks were being grouped/deduplicated on the frontend. This made it appear that the task was "complete" when only ONE member submitted, even though other members still needed to submit their work.

## Root Cause
In `client/app/dashboard/tasks/page.tsx` (lines 99-123), there was a "smart grouping" logic that:
1. Filtered pending tasks assigned to others
2. Removed duplicates by matching `title` and `description`
3. Showed only ONE card representing multiple members

This was done to "avoid clutter" but it prevented members from seeing their individual tasks.

## Solution Applied

### Changed: Task Display Logic
**File:** `client/app/dashboard/tasks/page.tsx`

**Before:**
```typescript
// Grouped pending tasks - only showed ONE card for all members
const uniqueOthersPending = othersPending.filter((task, index, self) => 
  index === self.findIndex((t) => (
    t.title === task.title && t.description === task.description
  ))
);
```

**After:**
```typescript
// NO GROUPING - Show each task individually so members can all submit
return [
    ...myWork,
    ...othersWork.sort((a, b) => {
        // Prioritize: Submitted > Pending > Rejected > Completed
        const priority: any = { Submitted: 1, Pending: 2, Rejected: 3, Completed: 4 };
        return priority[a.status] - priority[b.status];
    })
];
```

## How It Works Now

### For Members:
1. When a Head creates a task, **every member gets their own individual task**
2. Each member sees their task in "ACTIVE DEPLOYMENTS"
3. Each member submits independently
4. Task stays "Pending" for each member until THEY submit or deadline passes

### For Heads:
1. See ALL individual tasks from each member
2. Each submission appears separately in "INCOMING TRANSMISSIONS"
3. Can approve/reject each member's work individually
4. See exactly who submitted and who didn't

### Task Lifecycle (Per Member):
```
CREATE → Pending (waiting for member)
       ↓
    SUBMIT → Submitted (waiting for Head approval)
       ↓
   APPROVE → Completed (XP awarded) ✅
      OR
   REJECT → Rejected (member can resubmit)
       ↓
  DEADLINE → Expired (if not submitted before deadline)
```

## Benefits
✅ All members can submit independently  
✅ No confusion about task completion  
✅ Heads see individual progress for each member  
✅ Tasks remain active until deadline for ALL members  
✅ Fair XP distribution (only completed tasks get XP)

## Example Scenario

**Before Fix:**
- Head creates task for IT department (5 members)
- Member 1 submits → Task appears "complete" in UI
- Members 2, 3, 4, 5 think task is done ❌

**After Fix:**
- Head creates task for IT department (5 members)
- Member 1 submits → Their task shows "Submitted"
- Members 2, 3, 4, 5 still see "Pending" and can submit ✅
- Head sees 1 submission and 4 pending tasks ✅

## Files Modified
- `client/app/dashboard/tasks/page.tsx` (lines 99-118)

## Testing Checklist
- [ ] Head creates a task with deadline
- [ ] Multiple members can see the task
- [ ] First member submits
- [ ] Verify other members still see "Pending" status
- [ ] Verify Head sees individual submissions
- [ ] Verify all members can submit before deadline
- [ ] Verify deadline prevents late submissions
