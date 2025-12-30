# 🚀 PRE-LAUNCH CHECKLIST
**Enactus Portal - MongoDB M0 Free Tier Production Readiness**

**Date:** _____________  
**Completed By:** _____________  
**Environment:** Production (Bahrain M0 Cluster)

---

## 📋 CRITICAL TASKS (Must Complete Before Launch)

### ☐ 1. Clean Test Data (30 minutes)

**Steps:**
1. [ ] Login to [MongoDB Atlas](https://cloud.mongodb.com)
2. [ ] Navigate to: Clusters → enactus-portal → Browse Collections
3. [ ] Open "Data Explorer" tab
4. [ ] Run verification queries:

```javascript
// In the query console:
db.users.countDocuments({ isTest: true })
db.tasks.countDocuments({ isTest: true })
db.hourlogs.countDocuments({ isTest: true })
```

5. [ ] **If counts > 0**, run deletion queries:

```javascript
db.users.deleteMany({ isTest: true })
db.tasks.deleteMany({ isTest: true })
db.hourlogs.deleteMany({ isTest: true })
```

6. [ ] Verify deletion (all should return 0):

```javascript
db.users.countDocuments({ isTest: true })
db.tasks.countDocuments({ isTest: true })
db.hourlogs.countDocuments({ isTest: true })
```

7. [ ] Document results:
   - Users deleted: ___________
   - Tasks deleted: ___________
   - Hour logs deleted: ___________
   - Storage saved: ___________ MB

**Alternative:** Use automated script
```bash
# Linux/Mac
bash server/scripts/cleanup-test-data.sh
```

**Status:** ☐ Complete ☐ Not Needed (no test data)

---

### ☐ 2. Schedule Weekly Backups (15 minutes)

**Option A: Automated Script (Windows)**

1. [ ] Open PowerShell or Command Prompt **as Administrator**
2. [ ] Navigate to server folder:
```powershell
cd d:\E-Portal\enactus-portal\server\scripts
```
3. [ ] Run setup script:
```powershell
.\setup-backup-schedule.bat
```
4. [ ] Follow prompts and verify task creation
5. [ ] Test scheduled task:
```powershell
schtasks /run /tn "EnactusPortalBackup"
```
6. [ ] Check backup file created in `server/backups/`

**Option B: Manual Setup (Windows)**

1. [ ] Build TypeScript:
```powershell
cd d:\E-Portal\enactus-portal\server
npm run build
```

2. [ ] Create Task Scheduler job:
```powershell
schtasks /create /tn "EnactusPortalBackup" ^
/tr "node d:\E-Portal\enactus-portal\server\dist\scripts\backup.js" ^
/sc weekly /d SUN /st 02:00 /ru SYSTEM /f
```

3. [ ] Verify task:
```powershell
schtasks /query /tn "EnactusPortalBackup"
```

**Option C: Linux/Mac Cron**

1. [ ] Open crontab:
```bash
crontab -e
```

2. [ ] Add this line:
```
0 2 * * 0 cd /path/to/server && npm run backup >> backup.log 2>&1
```

3. [ ] Save and verify:
```bash
crontab -l
```

**Verification:**
- [ ] Scheduled task exists
- [ ] Test run completed successfully
- [ ] Backup file created in `server/backups/`
- [ ] Next run date: ___________

**Status:** ☐ Complete

---

### ☐ 3. Configure Storage Alert (15 minutes)

**Option A: MongoDB Atlas Alert (Recommended)**

1. [ ] Login to [MongoDB Atlas](https://cloud.mongodb.com)
2. [ ] Navigate to: Alerts → Create New Alert
3. [ ] Configure:
   - Alert Type: "Data Size"
   - Condition: "is above"
   - Threshold: **400** MB
   - Unit: MB
4. [ ] Add notification:
   - Method: Email
   - Recipients: _____________
5. [ ] Save alert
6. [ ] Test alert (optional)

**Option B: Manual Weekly Check**

1. [ ] Add to weekly maintenance schedule:
   - Every Sunday during backup review
   - Check: Clusters → Metrics → Storage Size
   - Alert team if > 400MB

**Verification:**
- [ ] Alert configured or weekly check scheduled
- [ ] Notification method tested
- [ ] Current storage size: ___________ MB

**Status:** ☐ Complete

---

### ☐ 4. Verify Database Indexes (10 minutes)

**Steps:**
1. [ ] Login to MongoDB Atlas
2. [ ] Navigate to: Collections → users
3. [ ] Click "Indexes" tab
4. [ ] Verify these indexes exist and "Building: false":
   - [ ] `{ role: 1, isTest: 1, hoursApproved: -1 }` ← Critical!
   - [ ] `{ department: 1, role: 1 }`
   - [ ] `{ email: 1 }` (unique)
   - [ ] `{ hoursApproved: -1 }`

5. [ ] Check "tasks" collection indexes:
   - [ ] `{ assignedTo: 1, status: 1 }`
   - [ ] `{ taskGroupId: 1, status: 1 }`
   - [ ] `{ isTest: 1 }`

6. [ ] Check "hourlogs" collection indexes:
   - [ ] `{ user: 1, status: 1 }`
   - [ ] `{ user: 1, isTest: 1, status: 1 }`

**If any index is missing or building:**
- Wait for build to complete (check "Status" column)
- If missing, contact development team

**Status:** ☐ Complete ☐ Issues Found (describe): __________

---

### ☐ 5. Test Backup Manually (10 minutes)

**Steps:**
1. [ ] Open terminal/command prompt
2. [ ] Navigate to server:
```bash
cd d:\E-Portal\enactus-portal\server
```

3. [ ] Run backup:
```bash
npm run backup
```

4. [ ] Wait for completion (should show):
   - Collection counts
   - Backup file size
   - Location path

5. [ ] Verify backup file:
```bash
cd backups
dir  # Windows
ls -lh  # Linux/Mac
```

6. [ ] Check file size: ___________ MB
7. [ ] Verify file contains data (open JSON file)

**Expected Results:**
- [ ] Backup completed without errors
- [ ] File size > 0 MB
- [ ] File contains user/task/hourlog data
- [ ] Backup location: `server/backups/backup-YYYY-MM-DD.json`

**Status:** ☐ Complete ☐ Failed (describe): __________

---

## 📊 VERIFICATION TASKS (Confirm Active)

### ☐ 6. Verify Connection Pooling (5 minutes)

**Steps:**
1. [ ] Open file: `server/src/lib/dbConnect.ts`
2. [ ] Verify these values:
   - [ ] `maxPoolSize: 10` ✅
   - [ ] `minPoolSize: 2` ✅
   - [ ] Global singleton pattern exists ✅

3. [ ] Check server logs during startup:
   - Should see: "✅ Using existing Mongoose connection"
   - Should NOT see multiple "🔌 Initiating MongoDB connection"

**Status:** ☐ Verified ☐ Issues Found

---

### ☐ 7. Verify Lean Projections (5 minutes)

**Steps:**
1. [ ] Open file: `server/src/controllers/userController.ts`
2. [ ] Check `getLeaderboard()` function has:
   - [ ] `.select('_id name hoursApproved department')` ✅
   - [ ] `.lean()` ✅

3. [ ] Check other controllers have `.lean()` and `.select()`
   - [ ] taskController.ts ✅
   - [ ] hourController.ts ✅

**Status:** ☐ Verified ✅ (Already confirmed in code)

---

### ☐ 8. Verify Validation Active (5 minutes)

**Steps:**
1. [ ] Open file: `server/src/controllers/taskController.ts`
2. [ ] Verify `createTask()` has:
   - [ ] `import { validate, createTaskSchema }` ✅
   - [ ] `validate(createTaskSchema, req.body)` ✅

3. [ ] Test validation (optional):
   - Try creating task with invalid URL
   - Should get validation error response

**Current Status:**
- [x] Tasks: PROTECTED ✅
- [ ] Users: PENDING (Week 1)
- [ ] Hours: PENDING (Week 1)

**Status:** ☐ Verified (67% complete)

---

## 📈 PERFORMANCE VERIFICATION

### ☐ 9. Test Leaderboard Performance (10 minutes)

**Steps:**
1. [ ] Open browser Developer Tools (F12)
2. [ ] Navigate to Dashboard → Leaderboard
3. [ ] Check Network tab:
   - API call to `/api/users/leaderboard`
   - Response time: ___________ ms (should be < 500ms)
   - Payload size: ___________ KB (should be < 50KB)

4. [ ] Check Console for cache logs:
   - Should see "✅ Serving from CACHE" after first load

5. [ ] Run Lighthouse audit:
   - Performance score: ___________ (should be > 90)

**Expected Results:**
- [ ] Leaderboard loads in < 500ms
- [ ] Cache is working (2-minute TTL)
- [ ] Performance score > 90

**Status:** ☐ Complete

---

### ☐ 10. Monitor Connection Count (Live Check)

**Steps:**
1. [ ] Login to MongoDB Atlas
2. [ ] Navigate to: Metrics → Connections
3. [ ] Check current connection count: ___________
4. [ ] Verify it's < 50 (well below 500 limit)

**During Peak Load (optional):**
- Have 10-20 users login simultaneously
- Check connection count doesn't spike above 100
- Connections should reuse from pool

**Status:** ☐ Verified

---

## 📝 DOCUMENTATION REVIEW

### ☐ 11. Review Documentation (10 minutes)

**Verify these files exist:**
- [ ] `server/M0_OPTIMIZATIONS.md` ✅
- [ ] `server/M0_QUICK_REFERENCE.md` ✅
- [ ] `server/M0_IMPLEMENTATION_SUMMARY.md` ✅
- [ ] `server/PRODUCTION_READINESS.md` ✅
- [ ] `server/PRODUCTION_STATUS_EMAIL.txt` ✅
- [ ] `README.md` (M0 section added) ✅

**Share with team:**
- [ ] Email PRODUCTION_STATUS_EMAIL.txt to stakeholders
- [ ] Brief team on M0_QUICK_REFERENCE.md
- [ ] Bookmark MongoDB Atlas dashboard

**Status:** ☐ Complete

---

## 🎯 POST-LAUNCH MONITORING (First Week)

### Daily Checks:
- [ ] **Monday:** Check storage usage (should be stable)
- [ ] **Tuesday:** Review error logs for validation issues
- [ ] **Wednesday:** Monitor connection count (should be < 100)
- [ ] **Thursday:** Check leaderboard performance (< 500ms)
- [ ] **Friday:** Review Atlas Performance Advisor
- [ ] **Saturday:** Prepare for Sunday backup
- [ ] **Sunday:** Verify backup completed successfully

### First Backup Review (Next Sunday):
- [ ] Check `server/backups/` folder
- [ ] Verify new backup file created
- [ ] Check backup.log for errors
- [ ] Verify old backups auto-deleted (only 4 kept)
- [ ] Document backup size: ___________ MB

---

## ✅ FINAL SIGN-OFF

### Pre-Launch Confirmation:

**I confirm the following are complete:**

- [ ] All test data deleted from production
- [ ] Weekly backups scheduled and tested
- [ ] Storage alert configured
- [ ] Database indexes verified active
- [ ] Manual backup test successful
- [ ] Connection pooling verified
- [ ] Lean projections verified
- [ ] Validation verified (67% coverage)
- [ ] Performance benchmarks met
- [ ] Documentation reviewed and shared

**Additional Notes:**
________________________________________________________________
________________________________________________________________
________________________________________________________________

**Signed:** _____________  
**Date:** _____________  
**Time:** _____________

---

## 🚨 ROLLBACK PLAN (If Issues Arise)

**If storage fills up:**
1. Delete old test data: `db.users.deleteMany({ isTest: true })`
2. Review largest collections in Atlas
3. Consider cleanup of old hour logs (> 6 months)

**If connections spike:**
1. Check dbConnect.ts is using singleton
2. Verify no connection leaks in controllers
3. Reduce maxPoolSize to 5 if needed

**If performance degrades:**
1. Check Atlas Performance Advisor
2. Verify indexes are not dropped
3. Check leaderboard cache is active
4. Review recent code changes

**If backup fails:**
1. Check backup.log for errors
2. Verify disk space available
3. Test manual backup: `npm run backup`
4. Contact development team

---

## 📞 EMERGENCY CONTACTS

**MongoDB Atlas Support:**
- Dashboard: https://cloud.mongodb.com
- Support: Available in Atlas dashboard

**Development Team:**
- Technical Lead: _____________
- DevOps: _____________

**Documentation:**
- M0 Optimizations: `server/M0_OPTIMIZATIONS.md`
- Quick Reference: `server/M0_QUICK_REFERENCE.md`
- This Checklist: `server/PRE_LAUNCH_CHECKLIST.md`

---

**Total Estimated Time:** 2-3 hours  
**Recommended Completion:** 1-2 days before launch  
**Last Updated:** 2025-12-29
