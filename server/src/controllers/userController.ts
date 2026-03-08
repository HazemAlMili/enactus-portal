// server/src/controllers/userController.ts
// Fully rewritten to use Supabase instead of Mongoose.

import { Request, Response } from 'express';
import getSupabaseAdmin from '../lib/supabaseAdmin';
import { mapProfile } from './authController';

// In-memory cache for leaderboard
let leaderboardCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 15000; // 15 seconds (reduced for faster updates)

/**
 * GET /api/users/leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Global cache handled inside the function logic to support per-role filtering
  // Previously: if (leaderboardCache && (Date.now() - leaderboardCache.timestamp) < CACHE_TTL) ...

  try {
    const currentUser = (req as any).user;
    const role = currentUser?.role;
    const dept = currentUser?.department;
    const isTest = currentUser?.is_test === true;

    // Determine restriction scope
    let restrictedDepts: string[] | null = null;
    if (role === 'HR') {
      const email = currentUser.email || '';
      const hrMatch = email.match(/^hr-(.+)@/);
      if (hrMatch) {
        const targetDept = hrMatch[1].toUpperCase().replace('MULTIMEDIA', 'Multi-Media');
        const validDepts = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
        const deptName = validDepts.find(d => d.replace(/[^a-zA-Z]/g, '').toLowerCase() === targetDept.replace(/[^a-zA-Z]/g, '').toLowerCase()) || targetDept;
        restrictedDepts = [deptName];
      }
    } else if (role === 'Member' && dept === 'HR') {
      if (currentUser?.position === 'Team Leader' && currentUser?.responsible_departments?.length > 0) {
        restrictedDepts = currentUser.responsible_departments;
      } else if (currentUser?.title?.startsWith('HR Coordinator')) {
        const coordDept = currentUser.title.split(' - ')[1];
        if (coordDept) restrictedDepts = [coordDept];
      }
    }

    // Skip global cache if restricted OR if test mode
    const skipCache = restrictedDepts !== null || isTest;

    if (!skipCache && leaderboardCache && (Date.now() - leaderboardCache.timestamp) < CACHE_TTL) {
      res.set('X-Cache', 'HIT');
      return res.json(leaderboardCache.data);
    }

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('profiles')
      .select('id, name, hours_approved, department')
      .eq('role', 'Member')
      .eq('is_highboard', false)
      .not('department', 'is', null)
      .order('hours_approved', { ascending: false })
      .limit(10);

    if (isTest) {
      query = query.eq('is_test', true);
    } else {
      query = query.neq('is_test', true);
    }

    if (restrictedDepts) {
      query = query.in('department', restrictedDepts);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    const mappedUsers = (users || []).map(u => ({
      id: u.id,
      name: u.name,
      department: u.department,
      hoursApproved: u.hours_approved
    }));

    if (!skipCache) {
      leaderboardCache = { data: mappedUsers, timestamp: Date.now() };
    }
    console.log(`✅ Leaderboard fetched in ${Date.now() - startTime}ms`);

    res.set('X-Cache', 'MISS');
    res.json(mappedUsers);
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    res.status(500).json({ message: 'Server Error', error: String(error) });
  }
};

/**
 * GET /api/users
 * Role-based filtering — same logic as before, now using Supabase.
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;
    const isTest = currentUser?.is_test === true;

    // Build the base query
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'Member');

    // Isolation: test users only see test users
    if (isTest) {
      query = query.eq('is_test', true);
    } else {
      query = query.neq('is_test', true);
    }

    // Role-based department scoping
    const role = currentUser?.role;
    const dept = currentUser?.department;

    if (role === 'Head' || role === 'Vice Head') {
      query = query.eq('department', dept);
    } else if (role === 'Operation Director') {
      query = query.in('department', ['PR', 'FR', 'Logistics', 'PM']);
    } else if (role === 'Creative Director') {
      query = query.in('department', ['Marketing', 'Multi-Media', 'Presentation', 'Organization']);
    } else if (role === 'HR') {
      const email = currentUser.email || '';
      const hrMatch = email.match(/^hr-(.+)@/);
      if (hrMatch) {
        const targetDept = hrMatch[1].toUpperCase().replace('MULTIMEDIA', 'Multi-Media');
        const validDepts = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
        const deptName = validDepts.find(d => d.replace(/[^a-zA-Z]/g, '').toLowerCase() === targetDept.replace(/[^a-zA-Z]/g, '').toLowerCase()) || targetDept;
        query = query.eq('department', deptName);
      }
      // General HR role sees all
    } else if (
      role === 'Member' &&
      dept === 'HR' &&
      currentUser?.position === 'Team Leader' &&
      currentUser?.responsible_departments?.length > 0
    ) {
      query = query.in('department', currentUser.responsible_departments);
    } else if (role === 'Member' && dept === 'HR' && currentUser?.title?.startsWith('HR Coordinator')) {
      const coordDept = currentUser.title.split(' - ')[1];
      query = query.eq('department', coordDept || 'HR');
    } else if (role === 'Member') {
      // Regular member — only see themselves
      query = query.eq('id', currentUser.id);
    }
    // General President sees all

    const { data: users, error } = await query;
    if (error) throw error;

    // Sort by role hierarchy
    const roleOrder: Record<string, number> = {
      'General President': 1, 'Vice President': 2,
      'Operation Director': 3, 'Creative Director': 3,
      'Head': 4, 'Vice Head': 5, 'HR': 6, 'Member': 7
    };
    const sorted = (users || []).sort((a: any, b: any) => {
      const rankA = roleOrder[a.role] || 99;
      const rankB = roleOrder[b.role] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });

    res.json(sorted.map(mapProfile));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * POST /api/users
 * Creates a new user in Supabase Auth + public.profiles.
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, department, team, position, title, responsibleDepartments } = (req as any).validatedBody;
    const currentUser = (req as any).user;
    const supabase = getSupabaseAdmin();

    // HR recruitment permission checks (identical logic to before)
    if (department === 'HR') {
      if (!['Head', 'Vice Head', 'General President', 'Vice President'].includes(currentUser.role)) {
        return res.status(403).json({ message: 'Only the HR Head (or Board) can recruit HR members.' });
      }
    } else {
      if (currentUser.department === 'HR') {
        if (currentUser.position === 'Team Leader' && currentUser.responsible_departments?.length > 0) {
          if (!currentUser.responsible_departments.includes(department)) {
            return res.status(403).json({ message: `You can only recruit for your responsible departments: ${currentUser.responsible_departments.join(', ')}` });
          }
        } else if (currentUser.title?.startsWith('HR Coordinator')) {
          const coordDept = currentUser.title.split(' - ')[1];
          if (coordDept && coordDept !== department) {
            return res.status(403).json({ message: `You can only recruit for the ${coordDept} department.` });
          }
        } else if (currentUser.role === 'Member') {
          return res.status(403).json({ message: 'You are not authorized to recruit for this department.' });
        }
      }
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return res.status(400).json({ message: `User with email '${email}' already exists.` });
    }

    // Create in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (authError) throw authError;

    const newUserId = authData.user.id;

    // Upsert profile — Supabase Auth trigger may have already created a skeleton row
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newUserId,
        name,
        email: email.toLowerCase().trim(),
        role: role || 'Member',
        department: department || null,
        team: team || null,
        position: position || 'Member',
        responsible_departments: position === 'Team Leader' && responsibleDepartments ? responsibleDepartments : [],
        title: title || null,
        is_test: currentUser?.is_test || false,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) throw profileError;

    // AUTO-ASSIGN EXISTING DEPARTMENT TASKS to new member
    if (department && (role === 'Member' || role === 'HR')) {
      let tasksQuery = supabase
        .from('tasks')
        .select('*')
        .eq('department', department)
        .neq('is_test', true);

      const { data: deptTasks } = await tasksQuery;

      if (deptTasks && deptTasks.length > 0) {
        const uniqueMissions = new Map<string, any>();
        deptTasks.forEach((t: any) => {
          if (t.team && team && t.team !== team) return;
          const key = `${t.title?.trim()}-${t.description?.trim()}`;
          if (!uniqueMissions.has(key)) uniqueMissions.set(key, t);
        });

        if (uniqueMissions.size > 0) {
          const tasksToCreate = Array.from(uniqueMissions.values()).map((template: any) => ({
            title: template.title,
            description: template.description,
            assigned_to: newUserId,
            assigned_by: template.assigned_by,
            department: template.department,
            team: template.team || null,
            score_value: template.score_value,
            resources_link: template.resources_link || [],
            status: 'Pending',
            is_test: profile.is_test,
          }));

          await supabase.from('tasks').insert(tasksToCreate);
        }
      }
    }

    res.status(201).json({ id: profile.id, name: profile.name, email: profile.email, role: profile.role });
  } catch (error: any) {
    console.error('Create user error:', error);
    // Log Supabase-specific error details if available
    if (error?.message) console.error('Error message:', error.message);
    if (error?.status) console.error('Supabase status:', error.status);
    if (error?.code) console.error('Supabase code:', error.code);
    const errMsg = error instanceof Error ? error.message : (error?.message || String(error));
    res.status(500).json({ message: 'Server Error', error: errMsg });
  }
};

/**
 * DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;
    const userId = req.params.id;

    // Fetch the user to delete
    const { data: userToDelete, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Isolation check
    if (currentUser?.is_test !== userToDelete.is_test) {
      return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    // Authorization check
    const isAdmin = ['General President', 'Vice President', 'Head', 'Vice Head'].includes(currentUser.role) || currentUser.department === 'HR';
    const isHRCoordinator = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator');
    let hasPermission = isAdmin;

    if (isHRCoordinator) {
      const parts = currentUser.title ? currentUser.title.split(' - ') : [];
      const coordDept = parts.length > 1 ? parts[1].trim() : null;
      hasPermission = !!(coordDept && userToDelete.department === coordDept);
    }

    if ((currentUser.role === 'Head' || currentUser.role === 'Vice Head') && userToDelete.department === currentUser.department) {
      hasPermission = true;
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    // Delete from Supabase Auth — cascades to profiles via FK
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    res.json({ message: 'User removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * PUT /api/users/avatar
 */
export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const { avatar } = req.body;
    const userId = (req as any).user?.id;
    const supabase = getSupabaseAdmin();

    if (avatar === undefined) {
      return res.status(400).json({ message: 'Avatar data is required' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ avatar: avatar || null })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Avatar updated for:', profile?.name);
    res.json(mapProfile(profile));
  } catch (error) {
    console.error('❌ Update avatar error:', error);
    res.status(500).json({ message: 'Server error updating avatar' });
  }
};

/**
 * POST /api/users/:id/warning
 */
export const addWarning = async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const { reason } = req.body;
    const currentUser = (req as any).user;
    const supabase = getSupabaseAdmin();

    const isHRCoordinator = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator');

    const isAuthorized = (
      currentUser.role === 'HR' || currentUser.role === 'Head' || currentUser.role === 'Vice Head' ||
      currentUser.department === 'HR' || currentUser.role === 'General President' || isHRCoordinator
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Only HR can issue warnings.' });
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (fetchError || !targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser.role !== 'Member') return res.status(400).json({ message: 'Warnings can only be issued to Members.' });
    if (currentUser?.is_test && !targetUser.is_test) return res.status(403).json({ message: 'Test accounts can only warn other test accounts.' });

    if (isHRCoordinator) {
      const coordDept = currentUser.title.split(' - ')[1];
      if (coordDept && targetUser.department !== coordDept) {
        return res.status(403).json({ message: `You are authorized to warn members of the ${coordDept} department only.` });
      }
    }

    const isHRHead = (currentUser.role === 'Head' || currentUser.role === 'Vice Head') && currentUser.department === 'HR';
    if (isHRHead && targetUser.department !== 'HR') {
      return res.status(403).json({ message: 'HR Head/Vice Head can only warn HR department members.' });
    }

    // Append to warnings JSONB array
    const currentWarnings: any[] = targetUser.warnings || [];
    const newWarning = { reason: reason || 'Violation of conduct', date: new Date().toISOString(), issuer: currentUser.name };
    const updatedWarnings = [...currentWarnings, newWarning];

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ warnings: updatedWarnings })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ message: 'Warning issued successfully.', warnings: updated.warnings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * DELETE /api/users/:id/warning/:index
 */
export const deleteWarning = async (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const warningIndex = parseInt(req.params.index);
    const currentUser = (req as any).user;
    const supabase = getSupabaseAdmin();

    const isHRCoordinator = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator');

    const isAuthorized = (
      currentUser.role === 'HR' || currentUser.role === 'Head' || currentUser.role === 'Vice Head' ||
      currentUser.department === 'HR' || currentUser.role === 'General President' || isHRCoordinator
    );

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Only HR can delete warnings.' });
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (fetchError || !targetUser) return res.status(404).json({ message: 'User not found' });
    if (currentUser?.is_test && !targetUser.is_test) return res.status(403).json({ message: 'Test accounts can only manage other test accounts.' });

    if (isHRCoordinator) {
      const coordDept = currentUser.title.split(' - ')[1];
      if (coordDept && targetUser.department !== coordDept) {
        return res.status(403).json({ message: `You are authorized to manage members of the ${coordDept} department only.` });
      }
    }

    const isHRHead = (currentUser.role === 'Head' || currentUser.role === 'Vice Head') && currentUser.department === 'HR';
    if (isHRHead && targetUser.department !== 'HR') {
      return res.status(403).json({ message: 'HR Head/Vice Head can only manage HR department members.' });
    }

    // Remove from warnings array
    const currentWarnings: any[] = targetUser.warnings || [];
    if (warningIndex < 0 || warningIndex >= currentWarnings.length) {
      return res.status(400).json({ message: 'Invalid warning index.' });
    }
    
    const updatedWarnings = currentWarnings.filter((_, i) => i !== warningIndex);

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ warnings: updatedWarnings })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ message: 'Warning deleted successfully.', warnings: updated.warnings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
