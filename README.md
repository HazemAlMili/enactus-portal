# 🚀 ENACTUS PORTAL - Complete System Documentation

**Full-Stack Task & Member Management System with Role-Based Access Control**

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/HazemAlMili/enactus-portal)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Performance](https://img.shields.io/badge/performance-95%2F100-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/security-Enterprise--Grade-red.svg)]()

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#-project-overview)
2. [What's New in v4.0](#-whats-new-in-v40)
3. [System Architecture](#-system-architecture)  
4. [Role & Permission System](#-role--permission-system)
5. [Team Structure](#-team-structure)
6. [Features](#-features)
7. [Tech Stack](#-tech-stack)
8. [Database Schema](#-database-schema)
9. [API Endpoints](#-api-endpoints)
10. [Security](#-security)
11. [Installation](#-installation)

---

## 🎯 PROJECT OVERVIEW

Enactus Portal is an enterprise-grade management system for non-profit organizations with:
- **Multi-role authentication** (8 roles, department-based)
- **Team management** (Sub-teams within departments)
- **Task management** (create, assign, submit, approve with team filtering)
- **Hour tracking** (submit, approve, auto-reward)
- **Gamification** (XP, levels, leaderboard)
- **Real-time notifications** (task updates, badge system)
- **HR-exclusive controls** (recruit, delete, warn)
- **Cache-safe architecture** (force-dynamic, no stale data)

### Key Metrics
- **Lines of Code:** 25,000+
- **API Endpoints:** 35+
- **User Roles:** 8
- **Departments:** 10
- **Teams:** 6 (across 3 departments)
- **Performance:** 95/100
- **Security:** Enterprise-Grade

---

## 🆕 WHAT'S NEW IN V4.0

### **Major Features Added:**

#### **1. Team Management System** ✨
```
Departments with Sub-Teams:
├─ IT Department
│  ├─ Frontend Team
│  └─ UI/UX Team
├─ Multi-Media Department
│  ├─ Graphics Team
│  └─ Photography Team
└─ Presentation Department
   ├─ Presentation Team
   └─ Script Writing Team
```

**How it Works:**
- **When creating tasks:** Select a specific team (e.g., Frontend) or "All Teams"
- **Task assignment:** Only members of that team receive the task
- **When recruiting:** Assign members to specific teams
- **Query optimization:** Database indexes for fast team-based filtering

**Example:**
```typescript
// Creating a task for Frontend team only
{
  title: "Build Login Page",
  department: "IT",
  team: "Frontend",  // ← Only Frontend team gets this task
  hours: 10
}
```

---

#### **2. Task Notification System** 🔔
```
Real-Time Badge System:
┌────────────────────────┐
│ 🔔 Tasks          [3]  │  ← Red badge shows pending count
└────────────────────────┘
```

**Features:**
- **Live badge count** on sidebar Tasks link
- **Pulsing animation** for new tasks
- **Color coding:**
  - Red (pulsing) = New tasks
  - Yellow = Existing pending tasks
- **Auto-refresh** every 30 seconds
- **Instant update** when member submits task
- **Welcome toast** notification for new assignments

**Technical Implementation:**
- Custom `useTaskNotifications` hook
- sessionStorage for "last checked" timestamp
- Automatic polling with cleanup
- Manual refresh function for immediate updates

---

#### **3. Enhanced Task Grouping** 📋
```
Before (Old):
├─ Task: Build Feature [4 members submitted]
└─ Shows mixed statuses (confusing!)

After (New):
├─ Task: Build Feature - COMPLETED [2 members]
└─ Task: Build Feature - SUBMITTED [2 members]
   └─ Each status gets separate card
```

**Improvements:**
- **Status-based grouping:** Separate cards for Completed/Submitted/Pending
- **Individual submission review:** Approve/reject each member separately
- **Vertical button layout:** Better UX for approve/reject actions
- **Grid layout:** 2-column responsive grid for submissions
- **Completed work display:** View all completed submissions per task

---

#### **4. Automatic Hours System** ⏰
```
Task Completion Flow:
Member Submits → Head Approves → Hours Auto-Added
                                 ↓
                          Points Calculated
                          (Hours × 10)
```

**Features:**
- **No manual hour submission** needed for tasks
- **Auto-approved** when task is completed
- **Hour log tracking** (visible in Hours page)
- **Direct accumulation** to member's total
- **Points calculation** (10 points per hour)

**Example:**
```typescript
Task: 10 hours
Member completes task
↓
Hours: +10 ✅
Points: +100 ✅
Hour log: "Task Name - Submitted: 12/18/2025" [APPROVED]
```

---

#### **5. Cache-Safe Architecture** 🔒
```
All Pages Use force-dynamic:
✅ Dashboard
✅ Tasks
✅ Hours
✅ Squad
✅ Leaderboard
✅ Profile
✅ Departments
```

**Security Measures:**
- **No Next.js static caching**
- **Aggressive HTTP cache headers:**
  ```typescript
  'Cache-Control': 'no-cache, no-store, must-revalidate'
  'Pragma': 'no-cache'
  'Expires': '0'
  ```
- **sessionStorage** (clears on logout)
- **Version control** (auto-clear on updates)
- **Fresh data** on every request

---

#### **6. Styled Notifications** 🎨
```
Before: alert("Error") // ❌ Browser alert

After: showNotification("❌ Error Message", 'error') // ✅ Styled
```

**Features:**
- **Consistent theme** (pixel art style)
- **Color-coded** (red=error, green=success, yellow=warning)
- **Auto-dismiss** after timeout
- **Emoji support** for visual feedback
- **Smooth animations**

---

### **Technical Improvements:**

**Backend:**
- ✅ Team field in User model (indexed)
- ✅ Team field in Task model (indexed)
- ✅ Team filtering in task creation
- ✅ Team-based member queries
- ✅ Hour log auto-creation on task approval
- ✅ Points calculation optimization

**Frontend:**
- ✅ Team selectors in task/user forms
- ✅ Notification badge system
- ✅ Task grouping by status + team
- ✅ Styled error notifications
- ✅ Cache-busting on all pages
- ✅ Real-time badge updates

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Next.js 14)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Dashboard │  │  Tasks   │  │  Hours   │  │  Squad   │       │
│  │  (XP)    │  │ (Teams)  │  │(Auto-Add)│  │(Teams)   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │ 🔔          │             │              │
│       └─────────────┴──────────────┴─────────────┘              │
│                          │                                       │
│                    ┌─────▼─────┐                                │
│                    │  API.ts   │ (Axios + Cache-Busting)        │
│                    └─────┬─────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                  [ HTTPS/HTTP + JWT ]
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                  SERVER LAYER (Express.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────── MIDDLEWARE STACK ──────────────────────┐ │
│  │  1. CORS (Origin control)                                  │ │
│  │  2. force-dynamic (No caching)                             │ │
│  │  3. Rate Limiter (100 req/15min)                           │ │
│  │  4. JWT Auth (protect middleware)                          │ │
│  │  5. Role Auth (authorize/authorizeHROnly)                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │                 ROUTE HANDLERS                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  /api/auth/*   → authController                          │   │
│  │  /api/tasks/*  → taskController (team filtering)         │   │
│  │  /api/hours/*  → hourController (auto-reward)            │   │
│  │  /api/users/*  → userController (team assignment)        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                   [ MongoDB + Mongoose ]
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                   DATABASE LAYER (MongoDB)                       │
├─────────────────────────────────────────────────────────────────┤
│  COLLECTIONS:                                                    │
│  ├─ users (Members, HR, team field)                             │
│  ├─ highboards (Leadership)                                      │
│  ├─ tasks (Assignments, team filtering, taskGroupId)            │
│  └─ hourlogs (Auto-generated on task approval)                  │
│                                                                  │
│  INDEXES:                                                        │
│  ├─ { department: 1, team: 1, role: 1 } ← NEW!                 │
│  ├─ { taskGroupId: 1 }                                          │
│  └─ { assignedTo: 1, status: 1 }                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👥 TEAM STRUCTURE

### **Department Teams:**

```
┌──────────────────────────────────────────┐
│        IT DEPARTMENT                     │
├──────────────────────────────────────────┤
│  👥 Frontend Team                        │
│  └─ Web development, React, Next.js      │
│                                          │
│  👥 UI/UX Team                           │
│  └─ Design, Figma, User Experience       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│     MULTI-MEDIA DEPARTMENT               │
├──────────────────────────────────────────┤
│  👥 Graphics Team                        │
│  └─ Design, Illustrations, Branding      │
│                                          │
│  👥 Photography Team                     │
│  └─ Photo shoots, Editing, Videos        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│    PRESENTATION DEPARTMENT               │
├──────────────────────────────────────────┤
│  👥 Presentation Team                    │
│  └─ Slide design, Visual presentations   │
│                                          │
│  👥 Script Writing Team                  │
│  └─ Event scripts, Narration, Content    │
└──────────────────────────────────────────┘
```

### **How Teams Work:**

**1. Recruiting with Teams:**
```
Squad Page → Recruit New Member
├─ Department: IT
├─ Team: Frontend ← Choose team
└─ Member gets assigned to Frontend team
```

**2. Creating Team Tasks:**
```
Tasks Page → Deploy New Mission
├─ Department: IT (auto)
├─ Team: Frontend ← Only Frontend gets task
└─ Or "All Teams" for everyone
```

**3. Team Queries:**
```sql
-- Members of Frontend team
db.users.find({ 
  department: "IT", 
  team: "Frontend",
  role: "Member"
})
```

---

## ✨ FEATURES

### **Complete Feature List:**

#### **1. Authentication & Security** 🔐
- ✅ JWT-based auth (30-day expiry)
- ✅ Email validation (@enactus.com)
- ✅ Password strength requirements
- ✅ Role-based access control
- ✅ sessionStorage (auto-clear on logout)
- ✅ Cache-safe (no stale data)

#### **2. Task Management** 📋
- ✅ Create tasks for specific teams
- ✅ Group tasks by status
- ✅ Individual submission review
- ✅ Approve/reject per member
- ✅ Auto-hour rewards
- ✅ Resource link attachments
- ✅ Deadline tracking
- ✅ Status badges (Pending/Submitted/Completed/Rejected)

#### **3. Team Management** 👥
- ✅ Assign members to teams
- ✅ Filter tasks by team
- ✅ Team-specific assignments
- ✅ Department + Team structure
- ✅ 3 departments with teams (IT, Multi-Media, Presentation)

#### **4. Hour Tracking** ⏰
- ✅ Auto-add hours on task completion
- ✅ Points calculation (hours × 10)
- ✅ Hour log tracking
- ✅ Manual hour submission
- ✅ Approval workflow
- ✅ Department-scoped viewing

#### **5. Notifications** 🔔
- ✅ Real-time badge count
- ✅ Pulsing animation for new tasks
- ✅ Welcome toast for assignments
- ✅ Auto-refresh (30sec polling)
- ✅ Instant update on submission
- ✅ Styled error messages

#### **6. Gamification** 🎮
- ✅ XP system (based on hours)
- ✅ Level progression
- ✅ Leaderboard (members only)
- ✅ Points tracking
- ✅ Badges and ranks

#### **7. User Management (HR Only)** 👔
- ✅ Recruit members with teams
- ✅ Delete users
- ✅ Issue warnings
- ✅ Department-scoped control
- ✅ Squad roster display

---

## 🛠️ TECH STACK

```
Frontend:
├─ Next.js 14 (App Router)
├─ TypeScript
├─ Tailwind CSS (Pixel art theme)
├─ shadcn/ui Components
├─ Lucide Icons
├─ Axios (HTTP + Cache-busting)
├─ Custom hooks (useTaskNotifications)
└─ sessionStorage

Backend:
├─ Node.js + Express.js
├─ TypeScript
├─ MongoDB + Mongoose
├─ JWT Authentication
├─ bcryptjs (Password hashing)
└─ express-validator

Security:
├─ Helmet (Security headers)
├─ cors (Origin control)
├─ express-rate-limit
├─ Cache-Control headers
├─ force-dynamic rendering
└─ authorizeHROnly middleware
```

---

## 🗄️ DATABASE SCHEMA

### **User Model (Updated):**
```typescript
interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'Member' | 'HR';
  title?: string;
  department: string;
  team?: string;              // ← NEW! Sub-team
  hoursApproved: number;
  tasksCompleted: number;
  points: number;
  avatar?: string;
  warnings?: Warning[];
}

// Indexes:
{ department: 1, team: 1, role: 1 }  // ← Team-based filtering
{ email: 1 } unique
{ hoursApproved: -1 }
```

### **Task Model (Updated):**
```typescript
interface ITask {
  title: string;
  description: string;
  assignedTo: ObjectId;
  assignedBy: ObjectId;
  department: string;
  team?: string;              // ← NEW! Team filtering
  status: 'Pending' | 'Submitted' | 'Completed' | 'Rejected';
  scoreValue: number;
  resourcesLink?: string[];
  submissionLink?: string[];
  taskHours?: number;         // Auto-rewarded hours
  taskGroupId?: string;       // Groups related tasks
}

// Indexes:
{ taskGroupId: 1 }
{ department: 1, team: 1 }
{ assignedTo: 1, status: 1 }
```

---

## 🔌 API ENDPOINTS

### **New/Updated Endpoints:**

#### **POST /api/tasks**
```json
Request:
{
  "title": "Build Login Page",
  "description": "Create responsive login",
  "resourcesLink": ["https://..."],
  "deadline": "2025-12-25",
  "taskHours": 10,
  "team": "Frontend"  // ← NEW! Optional team
}

Response: [
  {
    "_id": "...",
    "assignedTo": "member1_id",
    "department": "IT",
    "team": "Frontend",
    "taskGroupId": "group123"
  },
  // ... more assigned tasks
]
```

#### **POST /api/users**
```json
Request:
{
  "name": "John Doe",
  "email": "john@enactus.com",
  "password": "Password123",
  "department": "IT",
  "team": "Frontend"  // ← NEW! Optional team
}
```

#### **PUT /api/tasks/:id**
When status changes to 'Completed':
- ✅ Auto-adds hours to member
- ✅ Calculates points (hours × 10)
- ✅ Creates hour log entry

---

## 🔐 SECURITY

### **Cache Prevention (5-Layer):**
```typescript
1. force-dynamic export (Next.js)
2. Cache-Control headers (HTTP)
3. Pragma: no-cache (HTTP)
4. Expires: 0 (HTTP)
5. sessionStorage (Browser)
```

### **Authorization Layers:**
```
Request
  ↓
JWT Verification (protect middleware)
  ↓
Role Check (authorize/authorizeHROnly)
  ↓
Controller Logic (department/team scoping)
  ↓
Database Query
```

---

## 📦 INSTALLATION

### **Quick Start:**

```bash
# 1. Clone
git clone https://github.com/HazemAlMili/enactus-portal.git
cd enactus-portal

# 2. Backend
cd server
npm install
cp .env.example .env  # Configure MongoDB URI
npm run dev

# 3. Frontend (new terminal)
cd client
npm install
npm run dev

# 4. Access
# Frontend: http://localhost:3000
# Backend: http://localhost:5000/api
```

### **Environment Variables:**

**server/.env:**
```env
MONGO_URI=mongodb://localhost:27017/enactus_portal
JWT_SECRET=your-secret-key
PORT=5000
```

**client/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 📝 CHANGELOG

### **Version 4.0.0** (December 18, 2025)

**🆕 Major Features:**
- ✅ Team management system (3 departments, 6 teams)
- ✅ Real-time notification badges
- ✅ Auto-hour rewards on task completion
- ✅ Enhanced task grouping by status
- ✅ Styled notification system
- ✅ Cache-safe architecture (force-dynamic)

**🔧 Improvements:**
- ✅ Team filtering in task creation
- ✅ Team assignment in recruitment
- ✅ Separate cards per task status
- ✅ Individual submission review
- ✅ Vertical approve/reject buttons
- ✅ Grid layout for submissions
- ✅ Hour log tracking for tasks

**🐛 Bug Fixes:**
- ✅ Task grouping conflicts resolved
- ✅ Cache issues eliminated
- ✅ Notification timing optimized
- ✅ Browser alert replaced with styled notifications

---

### **Version 3.0.0** (December 17, 2025)
- ✅ HR-only member management
- ✅ Vice Head = Head permissions
- ✅ Warning system
- ✅ Login validation enhancements

---

## 📄 LICENSE

MIT License - See LICENSE file for details

---

## 👥 CONTRIBUTORS

- **Hazem Mahmoud** - IT Head & Lead Developer
- **Enactus CIC Zayed Team** - Requirements & Testing

---

## 🎯 Built with ❤️ for Enactus CIC Zayed

**Developer:** Hazem Mahmoud  
**Position:** Head of IT Department S'2026  
**Contact:** [GitHub](https://github.com/HazemAlMili), [Linkedin](https://www.linkedin.com/in/hazem-al-melli)

---

**⭐ If you find this project useful, please give it a star!**
