# 🚀 ENACTUS PORTAL - Complete System Documentation

**Full-Stack Task & Member Management System with Role-Based Access Control**

[![Version](https://img.shields.io/badge/version-7.0.0-blue.svg)](https://github.com/HazemAlMili/enactus-portal)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Database](https://img.shields.io/badge/database-Supabase-brightgreen.svg)]()
[![Auth](https://img.shields.io/badge/auth-Supabase--Auth-blue.svg)]()

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#-project-overview)
2. [Zero-Footprint Guest Mode](#-zero-footprint-guest-mode)
3. [Supabase Architecture](#-supabase-architecture)
4. [What's New in v7.0](#-whats-new-in-v70)
5. [System Architecture](#-system-architecture)  
6. [Role Architecture](#-role-architecture)
7. [Tech Stack](#-tech-stack)
8. [Installation](#-installation)
9. [Changelog](#-changelog)

---

## 🎯 PROJECT OVERVIEW

Enactus Portal is a high-performance management system tailored for the Enactus CIC Zayed chapter, featuring:
- **Multi-role authentication** (8 roles + specialized Guest mode)
- **Supabase Core** (Relational integrity, real-time potential, and secure auth)
- **Gamified Lifecycle** (XP, Levels, Leaderboard, Arcade audio feedback)
- **Task & Hours Engine** (Auto-rewarded hours, team filtering, individual review)
- **Performance Optimized** (Zero full-page reloads, aggressive server-side caching)

---

## 🕹️ ZERO-FOOTPRINT GUEST MODE

Perfect for training sessions or public demos without polluting the production database.

**Key Features:**
- **Interceptor Architecture:** All API calls are intercepted at the client side (`api.ts`).
- **LocalStorage Persistence:** "demo_" keys persist your session data across refreshes.
- **Branding:** Distinct "TRAINING VERSION" overlays.

---

## ⚡ SUPABASE ARCHITECTURE (V7.0)

The system has been fully migrated from MongoDB to **Supabase**, providing a more robust relational foundation:

1. ✅ **Relational Power:** PostgreSQL-backed storage for strict data integrity between Profiles, Tasks, and Hour Logs.
2. ✅ **Secure Auth:** Integrated Supabase Auth with JWT validation and Edge-compatible Session Refresh.
3. ✅ **Edge Middleware:** Next.js Middleware with `@supabase/ssr` ensures zero-latency session checks.
4. ✅ **SQL Schema:** Centralized schema definition in `server/scripts/supabase-schema.sql` for easy replication.
5. ✅ **Clean Controllers:** Switched from complex Mongoose aggregations to clean Supabase SDK queries.

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
│           │   Edge Middleware (SSR)   │  ◄── [Auth Check]   │
│           └─────────────┬─────────────┘                     │
└─────────────────────────┼───────────────────────────────────┘
                          │
                 [ Supabase Auth JWT ]
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                 BACKEND LAYER (Express.js)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────── MIDDLEWARE STACK ──────────────────┐   │
│  │ 1. Rate Limiting    2. Supabase Verify   3. Zod Schema│   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                               │
│           ┌─────────────────▼─────────────────┐             │
│           │       Controller Logic            │             │
│           │ (PostgreSQL + RLS Isolation)      │             │
│           └─────────────────┬─────────────────┘             │
└─────────────────────────────┼───────────────────────────────┘
                              │
                    [ Supabase PostgreSQL ]
```

---

## 🔐 ROLE ARCHITECTURE

The system employs a sophisticated **8-tier Permission Model** combined with **Parallel Environment Isolation** (Test vs. Real).

| Tier | Role | Scope of Authority |
|------|------|---------------------|
| 👑 | **Board** | Strategic oversight (GP, VP, HR Head) with global analytics. |
| 🎖️ | **Directorate** | Operational control (Operation/Creative Directors) over cross-dept guilds. |
| 🛡️ | **Head / Vice Head** | Departmental command, task delegation, and mission approval. |
| 👤 | **Standard Member** | Task execution, hour logging, and leaderboard competition. |
| 🕹️ | **Guest Mode** | Zero-DB simulation via LocalStorage interceptors for training. |
| 🧪 | **Test User** | Isolated data layer (`is_test: true`) for secure demonstrations. |

---

## 🚀 WHAT'S NEW IN V7.0

- 🛠️ **Supabase Migration:** Total removal of MongoDB dependency in favor of PostgreSQL.
- 🔐 **Identity v2:** Native Supabase Auth migration for better reliability and session management.
- 📊 **Filtered Leaderboards:** HR members now only see the leaderboard for their responsible departments.
- ⚡ **Turbo Navigation:** Replaced `window.location` reloads with Next.js Router for instant page transitions.
- 💎 **Clean UI:** Removed complex animations (mascot) for a faster, professional login experience.
- 🏆 **Auto-Reward Engine:** Fixed hours and points calculation to automatically update on Task Approval.

---

## 📦 INSTALLATION

### **Server Setup:**
```bash
cd server
npm install
# Create .env with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

### **Client Setup:**
```bash
cd client
npm install
# Create .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

---

## 📝 CHANGELOG

---

### **Version 7.0.0** (March 3, 2026)
**🆕 Supabase Core Migration:**
- ✅ **Database:** Complete transition from MongoDB to Supabase PostgreSQL.
- ✅ **Auth:** Integrated `@supabase/supabase-js` for secure authentication.
- ✅ **Performance:** Implemented Next.js Edge Middleware for server-side session management.
- ✅ **Navigation:** Removed all full-page reloads for a true SPA feel.

**🏎️ Bug Fixes & Logic:**
- ✅ **Leaderboard Filter:** HR members now see a restricted leaderboard based on their assigned guilds.
- ✅ **Task Hours:** Fixed invisible reward hours bug and automated XP calculation.
- ✅ **UI Cleanup:** Simplified login page and centered mission-critical forms.

---

### **Version 6.1.0** (January 21, 2026)
**🆕 HR Department Hierarchy:**
- ✅ **New Positions:** Introduced `Team Leader` vs `Member` distinction for HR.
- ✅ **Granular Tasking:** HR can now target missions to specific positions.

---

## 👥 CONTRIBUTORS

- **Hazem Mahmoud** - IT Head & Lead Architect
- **Enactus CIC Zayed Team** - Requirements & QA

---

## 🎯 Built with ❤️ for Enactus CIC Zayed
**Contact:** [GitHub](https://github.com/HazemAlMili) | [LinkedIn](https://www.linkedin.com/in/hazem-al-melli)
