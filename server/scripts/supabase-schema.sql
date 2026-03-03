-- ============================================================
-- ENACTUS PORTAL — Supabase PostgreSQL Schema
-- Run this ONCE in the Supabase SQL Editor before starting migration
-- ============================================================

-- ========================
-- ENUM TYPES
-- ========================
CREATE TYPE user_role AS ENUM (
  'General President', 'Vice President', 'Operation Director',
  'Creative Director', 'HR', 'Head', 'Vice Head', 'Member'
);

CREATE TYPE user_department AS ENUM (
  'General', 'IT', 'HR', 'PM', 'PR', 'FR',
  'Logistics', 'Organization', 'Marketing', 'Multi-Media', 'Presentation'
);

CREATE TYPE user_position AS ENUM ('Member', 'Team Leader');

CREATE TYPE task_status AS ENUM ('Pending', 'Submitted', 'Completed', 'Rejected');
CREATE TYPE task_target_position AS ENUM ('Member', 'Team Leader', 'Both');
CREATE TYPE hour_status AS ENUM ('Pending', 'Approved', 'Rejected');

-- ========================
-- TABLE: public.profiles
-- Merges users + highboards Mongoose collections into one table
-- ========================
CREATE TABLE public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  email                   TEXT NOT NULL UNIQUE,
  role                    user_role NOT NULL DEFAULT 'Member',
  title                   TEXT,
  department              user_department,
  team                    TEXT,
  position                user_position DEFAULT 'Member',
  responsible_departments user_department[] DEFAULT '{}',
  hours_approved          INTEGER NOT NULL DEFAULT 0,
  tasks_completed         INTEGER NOT NULL DEFAULT 0,
  points                  INTEGER NOT NULL DEFAULT 0,
  avatar                  TEXT,
  warnings                JSONB DEFAULT '[]'::jsonb,
  is_test                 BOOLEAN NOT NULL DEFAULT FALSE,
  is_highboard            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes (mirrors existing Mongoose indexes)
CREATE INDEX idx_profiles_department_role    ON public.profiles(department, role);
CREATE INDEX idx_profiles_dept_team_role     ON public.profiles(department, team, role);
CREATE INDEX idx_profiles_role               ON public.profiles(role);
CREATE INDEX idx_profiles_team               ON public.profiles(team);
CREATE INDEX idx_profiles_hours_approved     ON public.profiles(hours_approved DESC);
CREATE INDEX idx_profiles_points             ON public.profiles(points DESC);
CREATE INDEX idx_profiles_is_test_role       ON public.profiles(is_test, role);
CREATE INDEX idx_profiles_leaderboard        ON public.profiles(role, is_test, hours_approved DESC);

-- ========================
-- TABLE: public.tasks
-- ========================
CREATE TABLE public.tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT DEFAULT 'General Task',
  description       TEXT NOT NULL,
  assigned_to       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  deadline          TIMESTAMPTZ,
  department        user_department,
  team              TEXT,
  target_position   task_target_position DEFAULT 'Both',
  status            task_status NOT NULL DEFAULT 'Pending',
  score_value       INTEGER DEFAULT 50,
  resources_link    TEXT[] DEFAULT '{}',
  submission_link   TEXT[] DEFAULT '{}',
  task_hours        NUMERIC(5,2) DEFAULT 0,
  task_group_id     UUID,
  is_test           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned_to_status  ON public.tasks(assigned_to, status);
CREATE INDEX idx_tasks_department_status   ON public.tasks(department, status);
CREATE INDEX idx_tasks_created_at          ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_assigned_by_status  ON public.tasks(assigned_by, status);
CREATE INDEX idx_tasks_task_group_status   ON public.tasks(task_group_id, status);
CREATE INDEX idx_tasks_is_test             ON public.tasks(is_test);
CREATE INDEX idx_tasks_assigned_to_istest  ON public.tasks(assigned_to, is_test, status);

-- ========================
-- TABLE: public.hour_logs
-- ========================
CREATE TABLE public.hour_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount       NUMERIC(6,2) NOT NULL,
  description  TEXT NOT NULL,
  status       hour_status NOT NULL DEFAULT 'Pending',
  date         TIMESTAMPTZ DEFAULT NOW(),
  approved_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_test      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hour_logs_user_status    ON public.hour_logs(user_id, status);
CREATE INDEX idx_hour_logs_status_date    ON public.hour_logs(status, created_at DESC);
CREATE INDEX idx_hour_logs_created_at     ON public.hour_logs(created_at DESC);
CREATE INDEX idx_hour_logs_user_istest    ON public.hour_logs(user_id, is_test, status);

-- ========================
-- RLS: profiles
-- ========================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all profiles (leaderboard, user lists, task assignment)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Service role bypasses RLS automatically (used by Express server for admin ops)

-- ========================
-- RLS: tasks
-- ========================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_authenticated"
  ON public.tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_insert_authenticated"
  ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tasks_update_authenticated"
  ON public.tasks FOR UPDATE TO authenticated USING (true);

CREATE POLICY "tasks_delete_authenticated"
  ON public.tasks FOR DELETE TO authenticated USING (true);

-- ========================
-- RLS: hour_logs
-- ========================
ALTER TABLE public.hour_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hour_logs_select_authenticated"
  ON public.hour_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "hour_logs_insert_authenticated"
  ON public.hour_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "hour_logs_update_authenticated"
  ON public.hour_logs FOR UPDATE TO authenticated USING (true);

-- ========================
-- AUTO-PROFILE TRIGGER
-- Creates a row in public.profiles whenever a new auth.users row is inserted
-- Acts as a safety net for new signups after migration
-- ========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================
-- updated_at auto-update trigger
-- ========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER set_profiles_updated_at  BEFORE UPDATE ON public.profiles  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_tasks_updated_at      BEFORE UPDATE ON public.tasks      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_hour_logs_updated_at  BEFORE UPDATE ON public.hour_logs  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
