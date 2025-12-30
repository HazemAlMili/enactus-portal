# 🛡️ Enactus Portal - Admin Dashboard Guide

**Secure Monitoring & Management for General President & IT Head**

The **Admin Dashboard** is a protected interface designed for the **General President** and **Head of IT** to monitor system health, manage database resources, and perform critical maintenance tasks like test data cleanup and manual backups.

---

## 🔑 Access & Security

- **URL:** `/dashboard/admin`
- **Link Location:** Sidebar (bottom) - Visible only to authorized roles.
- **Authorized Roles:**
  - `General President` (Any Department)
  - `Head` (IT Department ONLY)
- **Protection:**
  - JWT Authentication required.
  - Role-based authorization middleware on both Frontend (Sidebar) and Backend API routes.

---

## 📊 Features & Monitoring

### 1. Overall System Health
- **Health Score:** 0-100% calculation based on storage, connections, backup status, and data integrity.
- **Status Indicators:**
  - ✅ **Healthy:** All systems nominal.
  - ⚠️ **Warning:** Approaching limits (e.g., storage > 80%, connections > 50).
  - 🚨 **Critical:** Action required immediately (e.g., storage > 90%, no backups).

### 2. Database Storage (MongoDB M0 Free Tier)
- **Monitoring:** Real-time tracking of data size vs. the **512MB limit**.
- **Visuals:** Progress bar changing color from Green -> Yellow -> Red as usage increases.
- **Metrics:** Data Size, Index Size, Total Used.

### 3. Connection Pool
- **Why it matters:** Serverless environments (like Vercel) can exhaust connections.
- **Monitoring:** Active connections vs. **500 connection limit**.
- **Pool Stats:** Current, Max Pool Size, Min Pool Size.

### 4. Data Summary
- **Users:** Total, Regular Members, Leadership (HighBoard/Heads).
- **Tasks:** Total, Pending, Completed.
- **Hour Logs:** Total hours logged.
- **Test Data Detection:** Highlights count of "test" users/tasks in yellow.

### 5. Backup Status
- **Location:** `server/backups/`
- **Info:** Date of last backup, file size, total number of backups retained.
- **Retention:** Auto-cleans old backups, keeping the last 4 files.

---

## 🛠️ Administrative Actions

### 🗑️ Clean Up Test Data
**Action:** Deletes ALL users, tasks, and hour logs that contain "test" in their name/title/email.
- **Use Case:** Clearing the database after a testing session or demo.
- **Safety:** Requires confirmation. Returns a summary of deleted items.

### 💾 Trigger Manual Backup
**Action:** Immediately initiates a full database backup.
- **Method:** Uses `mongodump` (if installed) or falls back to JSON export.
- **Use Case:** Run before deployment or major data changes.
- **Output:** Saves file to `server/backups/` with timestamp.

---

## ⚡ Troubleshooting

### "Access Denied"
- Ensure you are logged in as **General President** or **Head of IT**.
- Refresh the page to ensure your session token is valid.

### "Failed to load system statistics"
- Check if the backend server is running (`npm run dev` or `npm start`).
- Verify database connection in server logs.

### Storage Critical Warning
- **Immediate Action:** Click "Clean Up Test Data".
- **Secondary Action:** Manually delete old `backups` from the server if disk space is the issue (though DB storage is separate).

---

## 🧑‍💻 Developer Notes

- **Frontend:** `client/app/dashboard/admin/page.tsx`
- **Backend Controller:** `server/src/controllers/adminController.ts`
- **Routes:** `server/src/routes/adminRoutes.ts`
- **Backup Script:** `server/src/scripts/backup.ts`

**Update Frequency:** Dashboard auto-refreshes every **30 seconds**.
