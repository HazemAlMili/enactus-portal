# 🚀 ENACTUS PORTAL - Complete System Documentation

**Full-Stack Task & Member Management System with Role-Based Access Control**

[![Version](https://img.shields.io/badge/version-6.1.0-blue.svg)](https://github.com/HazemAlMili/enactus-portal)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Performance](https://img.shields.io/badge/performance-99%2F100-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/security-Enterprise--Grade-red.svg)]()

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#-project-overview)
2. [Zero-Footprint Guest Mode](#-zero-footprint-guest-mode)
3. [Admin Command Center](#-admin-command-center)
4. [M0 Performance Tuning](#-m0-performance-tuning)
5. [What's New in v6.0](#-whats-new-in-v60)
6. [System Architecture](#-system-architecture)  
7. [Role Architecture](#-role-architecture)
8. [Features](#-features)
9. [Tech Stack](#-tech-stack)
10. [Database Schema](#-database-schema)
11. [Installation](#-installation)

---

## 🎯 PROJECT OVERVIEW

Enactus Portal is a high-performance management system tailored for the Enactus CIC Zayed chapter, featuring:
- **Multi-role authentication** (8 roles + specialized Guest mode)
- **Zero-DB Guest Mode** (Local persistence for training/demo sessions)
- **Admin Command Center** (Real-time storage & connection monitoring)
- **M0 Optimized Core** (Lean projections, connection pooling, singleton pattern)
- **Gamified Lifecycle** (XP, Levels, Leaderboard, Arcade audio feedback)
- **Task & Hours Engine** (Auto-rewarded hours, team filtering, individual review)

### Key Metrics
- **Performance:** 98/100 (Lighthouse optimized)
- **Storage:** Verified @enactus.com accounts only
- **Concurrency:** Managed pool (max 10) for M0 stability
- **Architecture:** Zero-cache (force-dynamic) for real-time accuracy

---

## 🕹️ ZERO-FOOTPRINT GUEST MODE

Perfect for training sessions or public demos without polluting the production database.

**Key Features:**
- **Interceptor Architecture:** All API calls are intercepted at the client side (`api.ts`).
- **LocalStorage Persistence:** "demo_" keys persist your session data across refreshes.
- **Role Continuity:** Access management links (Squad, Departments, Leaderboard) even in demo mode.
- **Branding:** Distinct "TRAINING VERSION" overlays.

**How to Use:**
Simply click **"GUEST ACCESS"** on the login screen. No database calls, no network latency, full accessibility.

---

## 🛡️ ADMIN COMMAND CENTER

A specialized dashboard for the **IT Head** to monitor system health and maintain the M0 Free Cluster.

**Monitoring Tools:**
- **Storage Health:** Track BSON size and index overhead vs the 512MB M0 limit.
- **Connection Tracker:** Real-time visibility into active sessions vs the 500-con limit.
- **Health Checks:** Automated overall system status (Storage, Sync, Backups).
- **Cleanup Utility:** One-click deletion of test/demo data to keep the database clean.

---

## 🏎️ M0 PERFORMANCE TUNING

The system is architected to fly on the **MongoDB M0 Free Tier** by using enterprise-grade patterns:

1. ✅ **The Singleton Pattern:** Ensures only one database connection exists per serverless instance.
2. ✅ **Managed Pooling:** `maxPoolSize` locked to 10 to ensure zero "Connection Exhaustion" events.
3. ✅ **Lean Projections:** Every query uses `.lean()` and `.select()` to save memory and JSON overhead.
4. ✅ **Buffer Guards:** `bufferCommands: false` ensures requests fail fast if the DB is unreachable instead of hanging.
5. ✅ **Unified Validation:** Strict Zod schemas (`credentialsSchema`) prevent oversized or malformed data at the entry point.

---

## 🔌 API ENDPOINTS (ADMIN & SYSTEM)

### **Admin Maintenance:**
#### **GET /api/admin/stats**
Returns real-time cluster metrics (Storage size, Connections, Object count).
#### **POST /api/admin/trigger-backup**
Creates a JSON snapshot of the entire database in `server/backups/`.
#### **DELETE /api/admin/cleanup-test-data**
Safely removes all accounts/records marked with `isTest: true`.

### **Unified Auth:**
#### **POST /api/auth/login**
Validated through `loginSchema`. Enforces `@enactus.com` and min 6-char passwords.
#### **POST /api/users**
Validated through `createUserSchema`. Synchronized with login rules to prevent un-loggable accounts.

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND LAYER (Next.js 14)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │Dashboard │  │ Admin    │  │ Tasks    │  │ Identity │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │             │             │           │
│       └─────────────┴───┬─────────┴─────────────┘           │
│                         │                                   │
│           ┌─────────────▼─────────────┐                     │
│           │      API Interceptor      │ ◄─── [GUEST MODE]   │
│           └─────────────┬─────────────┘      (LocalStorage) │
└─────────────────────────┼───────────────────────────────────┘
                          │
                 [ JWT + Zod Validation ]
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                 BACKEND LAYER (Express.js)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────── MIDDLEWARE STACK ──────────────────┐   │
│  │ 1. Rate Limiting    2. JWT Verify   3. Zod Schema    │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                               │
│           ┌─────────────────▼─────────────────┐             │
│           │       Controller Logic            │             │
│           │ (Lean + Singleton Connection)     │             │
│           └─────────────────┬─────────────────┘             │
└─────────────────────────────┼───────────────────────────────┘
                              │
                    [ MongoDB M0 Cluster ]
```

---

## 🔐 ROLE ARCHITECTURE

The system employs a sophisticated **8-tier Permission Model** combined with **Parallel Environment Isolation** (Test vs. Real).

| Tier | Role | Scope of Authority |
|------|------|---------------------|
| 👑 | **Presidential Suite** | Strategic oversight, global analytics, and full system management. |
| 🎖️ | **Directorate** | Operational control over cross-departmental workflows and creative outputs. |
| 👥 | **HR Department** | Member lifecycle management, disciplinary tracking, and hour audit logs. |
| 🛡️ | **Head / Vice Head** | Departmental command, task delegation, and squad performance reviews. |
| 👤 | **Standard Member** | Task execution, hour logging, and departmental mini-game participation. |
| 🕹️ | **Guest Mode** | Zero-DB simulation via LocalStorage interceptors for training purposes. |
| 🧪 | **Visitor System** | Isolated data layer (`isTest: true`) for secure portfolio demonstrations. |

---

## 🚀 WHAT'S NEW IN V6.0

- 🔒 **Parallel Data Isolation:** Strict middleware-level filtering for `isTest` accounts ensuring complete privacy for real members.
- 📊 **Real-time Health Monitoring:** 100-point performance score tracking M0 storage limits and connection pool health.
- 👥 **HR Tiered Hierarchy:** Introduction of `Team Leader` and `Member` positions within the HR department for granular task targeting.
- ⚡ **Lighthouse 99+:** Optimized React components and server-side caching (TTL 120s) for instant page loads.
- 🏎️ **Memoized HUD:** Memoization of heavy task/leaderboard rows for smooth 60FPS mobile interactions.
- 💎 **Metallic Design System:** A complete visual overhaul featuring silver/gray aesthetics and glassmorphism.
- 📱 **Mobile Performance:** Paginated leaderboards and optimized touch-targets for task management.

---

## 📦 INSTALLATION

### **Server Setup:**
```bash
cd server
npm install
# Create .env with MONGO_URI, JWT_SECRET
npm run dev
```

### **Client Setup:**
```bash
cd client
npm install
# Create .env.local with NEXT_PUBLIC_API_URL
npm run dev
```

---

## 📝 CHANGELOG

---

### **Version 6.1.0** (January 21, 2026)
**🆕 HR Department Hierarchy:**
- ✅ **New Positions:** Introduced `Team Leader` vs `Member` distinction for HR department personnel.
- ✅ **Granular Tasking:** HR can now target missions to specific positions (Only TLs, Only Members, or Both).
- ✅ **Identity Badges:** Automatic position badging in Dashboard, Profile Page, and Team Cards.
- ✅ **Compact Recruitment:** Refactored the "Recruit Player" modal into a responsive 2-column grid to reduce vertical footprint.

**🏎️ Performance & UX:**
- ✅ **Row Memoization:** Wrapped all Task and Leaderboard rows in `React.memo` to eliminate redundant re-renders.
- ✅ **Memoized Filtering:** Used `useMemo` for heavy grouping logic in Guild Hall and Squad Roster views.
- ✅ **Table Polish:** Standardized column widths and removed redundant columns (e.g., "Class" in Squad table) for better mobile visibility.

---

### **Version 6.0.0** (January 17, 2026)
**🆕 Security & Monitoring:**
- ✅ **Data Separation:** Multi-layered isolation for test vs. real accounts (`isTest` filter).
- ✅ **Health Scoring:** Automated 100-point system health monitoring for IT Admins.
- ✅ **Aesthetic Refinement:** Implementation of the "Metallic Silver" Design System.
- ✅ **Leaderboard Optimization:** Top 10 + Pagination logic for improved mobile Speed Index.
- ✅ **New Mini-Games:** Implementation of "One-Minute Pitch" for Presentation department.

---

### **Version 5.0.0** (December 30, 2025)
**🆕 Major Enhancements:**
- ✅ **Admin Command Center:** Health monitoring for M0 Storage & Connections.
- ✅ **Zero-Footprint Guest Mode:** Intercepted demo sessions with LocalStorage persistence.
- ✅ **Unified Validation:** Centralized Zod schemas for login and recruitment.
- ✅ **M0 Performance Polish:** Lean projections and singleton connection patterns.
- ✅ **Identity UX:** Role-based identity styling (Boss levels for Directors/Board).

**🔧 Improvements:**
- ✅ Improved session persistence on page refresh.
- ✅ Strict @enactus.com domain enforcement.
- ✅ Mobile-responsive Sidebar with Sheet navigation.
- ✅ Lighthouse score optimization to 98+.

---

### **Version 4.0.0** (December 18, 2025)
- ✅ Team management system (IT, Multimedia, Presentation).
- ✅ Real-time notification badges.
- ✅ Auto-hour rewards on task completion.
- ✅ Arcade Sound Library (7 retro chiptune sounds).

---

## 👥 CONTRIBUTORS

- **Hazem Mahmoud** - IT Head & Lead Architect
- **Enactus CIC Zayed Team** - Requirements & QA

---

## 🎯 Built with ❤️ for Enactus CIC Zayed
**Contact:** [GitHub](https://github.com/HazemAlMili) | [LinkedIn](https://www.linkedin.com/in/hazem-al-melli)
