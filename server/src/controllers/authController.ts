// server/src/controllers/authController.ts
// Auth controller using Supabase Auth — no more bcrypt/JWT.

import { Request, Response } from 'express';
import getSupabaseAdmin from '../lib/supabaseAdmin';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 * The 'protect' middleware already validated the token and attached req.user.
 */
export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Return profile in a consistent shape (map snake_case back to camelCase for frontend compat)
  res.json(mapProfile(user));
};

/**
 * POST /api/auth/change-password
 * Changes the current user's password via Supabase Auth admin.
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Password changed successfully for user: ${(req as any).user?.name}`);
    res.json({ message: 'Password changed successfully', success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      message: 'Server error during password change',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Maps a Supabase profile row (snake_case) to the camelCase shape
 * that the frontend already expects.
 */
export function mapProfile(profile: any) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    title: profile.title,
    department: profile.department,
    team: profile.team,
    position: profile.position || 'Member',
    responsibleDepartments: profile.responsible_departments || [],
    hoursApproved: profile.hours_approved || 0,
    tasksCompleted: profile.tasks_completed || 0,
    points: profile.points || 0,
    avatar: profile.avatar,
    warnings: profile.warnings || [],
    isTest: profile.is_test || false,
    isHighboard: profile.is_highboard || false,
  };
}
