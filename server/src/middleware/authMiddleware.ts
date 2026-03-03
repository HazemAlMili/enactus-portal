// server/src/middleware/authMiddleware.ts
// Validates Supabase JWTs instead of custom JWTs.
// Fetches the user's profile from public.profiles after token validation.

import { Request, Response, NextFunction } from 'express';
import getSupabaseAdmin from '../lib/supabaseAdmin';

/**
 * Middleware to protect routes.
 * Validates the Supabase JWT from the Authorization header.
 * Attaches the full profile to req.user if valid.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Validate the JWT against Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // Fetch full profile from public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ message: 'Not authorized, user profile not found' });
    }

    // Attach profile to request (compatible shape — use 'id' everywhere, not '_id')
    // @ts-ignore
    req.user = profile;

    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Middleware to restrict access based on user roles.
 * @param roles - List of allowed roles (e.g. 'Head', 'HR')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;

    const isHRCoordinator = user?.role === 'Member' && user?.department === 'HR' && user?.title?.startsWith('HR Coordinator');
    const isAllowedRole = roles.includes(user?.role || '');
    const isAllowedHRCoord = isHRCoordinator && (roles.includes('HR') || roles.includes('Head'));

    if (!user || (!isAllowedRole && !isAllowedHRCoord)) {
      // @ts-ignore
      return res.status(403).json({ message: `User role ${req.user?.role} is not authorized to access this route` });
    }
    next();
  };
};

/**
 * Middleware to restrict access to HR department ONLY.
 */
export const authorizeHROnly = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Not authorized, no user found' });
  }

  const isHRDepartment = user.department === 'HR';
  const isHRCoordinator = user.role === 'Member' && user.department === 'HR' && user.title?.startsWith('HR Coordinator');
  const isHRHead = (user.role === 'Head' || user.role === 'Vice Head') && user.department === 'HR';
  const isTeamLeader = user.department === 'HR' && user.position === 'Team Leader';

  if (isHRDepartment && (isHRHead || isHRCoordinator || isTeamLeader || user.role === 'HR')) {
    return next();
  }

  return res.status(403).json({
    message: `Access denied. Only HR department members can perform this action.`
  });
};
