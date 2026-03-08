// server/src/controllers/hourController.ts
// Fully rewritten to use Supabase instead of Mongoose.

import { Request, Response } from 'express';
import getSupabaseAdmin from '../lib/supabaseAdmin';

/**
 * POST /api/hours
 */
export const submitHours = async (req: Request, res: Response) => {
  try {
    const { amount, description, date, targetUserId } = req.body;
    const currentUser = (req as any).user;
    const supabase = getSupabaseAdmin();

    const isHRCoordinator = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator');
    const isTeamLeader = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.position === 'Team Leader' && currentUser.responsible_departments?.length > 0;
    const canGiveHours = ['HR', 'General President', 'Vice President'].includes(currentUser.role) || currentUser.department === 'HR' || isHRCoordinator || isTeamLeader;

    const logData: any = {
      amount,
      description,
      date: date || new Date().toISOString(),
      is_test: currentUser.is_test || false,
    };

    if (targetUserId && canGiveHours) {
      const { data: targetUser } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();

      // Isolation check
      if (targetUser && currentUser.is_test !== targetUser.is_test) {
        return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
      }
      // HR department restriction — allow Heads, GP, VP, HR role, and HR Coordinators/TLs assigned to HR dept
      if (targetUser && targetUser.department === 'HR') {
        const coordDeptForHR = isHRCoordinator ? currentUser.title.split(' - ')[1] : null;
        const hasHRAuth = ['Head', 'Vice Head', 'General President', 'Vice President'].includes(currentUser.role)
          || currentUser.role === 'HR'
          || (isHRCoordinator && coordDeptForHR === 'HR')
          || isTeamLeader;
        if (!hasHRAuth) {
          return res.status(403).json({ message: 'Only the HR Head can add hours for HR Department members.' });
        }
      }
      // HR Coordinator dept restriction
      if (isHRCoordinator) {
        const coordDept = currentUser.title.split(' - ')[1];
        if (coordDept && targetUser && targetUser.department !== coordDept) {
          return res.status(403).json({ message: `You are authorized to add hours only for the ${coordDept} department.` });
        }
      }
      // Team Leader dept restriction
      if (isTeamLeader && targetUser && !currentUser.responsible_departments.includes(targetUser.department)) {
        return res.status(403).json({ message: `You are authorized to add hours only for members in: ${currentUser.responsible_departments.join(', ')}` });
      }

      logData.user_id = targetUserId;
      logData.status = 'Approved';
      logData.approved_by = currentUser.id;

      // Update target user stats (support deduction via negative amount, clamped to 0)
      if (targetUser) {
        const numAmount = Number(amount);
        await supabase.from('profiles').update({
          hours_approved: Math.max(0, (targetUser.hours_approved || 0) + numAmount),
          points: Math.max(0, (targetUser.points || 0) + numAmount * 10),
        }).eq('id', targetUserId);
      }
    } else {
      logData.user_id = currentUser.id;

      // Auto-approve for HR/Board logging own hours
      if (['HR', 'General President', 'Vice President'].includes(currentUser.role)) {
        logData.status = 'Approved';
        logData.approved_by = currentUser.id;
        // Update own stats (clamped to 0)
        const numAmount = Number(amount);
        await supabase.from('profiles').update({
          hours_approved: Math.max(0, (currentUser.hours_approved || 0) + numAmount),
          points: Math.max(0, (currentUser.points || 0) + numAmount * 10),
        }).eq('id', currentUser.id);
      } else {
        logData.status = 'Pending';
      }
    }

    const { data: hourLog, error } = await supabase.from('hour_logs').insert(logData).select().single();
    if (error) throw error;

    res.status(201).json(hourLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * GET /api/hours
 */
export const getHours = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;
    const isTest = currentUser.is_test === true;

    let userIds: string[] | null = null; // null = no filter (see all)

    const getProfileIds = async (filters: Record<string, any>): Promise<string[]> => {
      let q = supabase.from('profiles').select('id');
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          q = q.in(key, value);
        } else {
          q = q.eq(key, value);
        }
      }
      if (isTest) { q = q.eq('is_test', true); } else { q = q.neq('is_test', true); }
      const { data } = await q;
      return (data || []).map((u: any) => u.id);
    };

    const role = currentUser.role;
    const dept = currentUser.department;

    if (role === 'Member' && dept === 'HR' && currentUser.position === 'Team Leader' && currentUser.responsible_departments?.length > 0) {
      userIds = await getProfileIds({ department: currentUser.responsible_departments });
    } else if (dept === 'HR' && role === 'Member') {
      if (currentUser.title?.startsWith('HR Coordinator')) {
        const coordDept = currentUser.title.split(' - ')[1];
        userIds = coordDept ? await getProfileIds({ department: coordDept }) : [currentUser.id];
      } else {
        userIds = [currentUser.id];
      }
    } else if (role === 'Member') {
      userIds = [currentUser.id];
    } else if (role === 'Head' || role === 'Vice Head') {
      userIds = await getProfileIds({ department: dept });
    } else if (role === 'Operation Director') {
      userIds = await getProfileIds({ department: ['PR', 'FR', 'Logistics', 'PM'] });
    } else if (role === 'Creative Director') {
      userIds = await getProfileIds({ department: ['Marketing', 'Multi-Media', 'Presentation', 'Organization'] });
    } else if (role === 'HR') {
      const email = currentUser.email || '';
      const hrMatch = email.match(/^hr-(.+)@/);
      if (hrMatch) {
        const token = hrMatch[1].toUpperCase().replace('MULTIMEDIA', 'Multi-Media');
        const validDepts = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
        const deptName = validDepts.find(d => d.replace(/[^a-zA-Z]/g, '').toLowerCase() === token.replace(/[^a-zA-Z]/g, '').toLowerCase()) || token;
        userIds = await getProfileIds({ department: deptName });
      } else {
        const { department } = req.query;
        if (department && department !== 'All') {
          userIds = await getProfileIds({ department: department as string });
        }
        // else null = see all
      }
    } else if (['General President', 'Vice President'].includes(role)) {
      const { department } = req.query;
      if (department && department !== 'All') {
        userIds = await getProfileIds({ department: department as string });
      }
      // else null = see all
    }

    // Build hour_logs query
    let query = supabase
      .from('hour_logs')
      .select(`*, user:profiles!hour_logs_user_id_fkey(id, name, role, department)`)
      .order('created_at', { ascending: false });

    if (isTest) { query = query.eq('is_test', true); } else { query = query.neq('is_test', true); }
    if (userIds !== null) { query = query.in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']); }

    const { data: logs, error } = await query;
    if (error) throw error;

    const mappedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      user: log.user,
      userId: log.user_id,
      amount: log.amount,
      description: log.description,
      status: log.status,
      createdAt: log.created_at
    }));

    res.json(mappedLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * PUT /api/hours/:id
 */
export const updateHourStatus = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;

    if (currentUser.role === 'Operation Director' || currentUser.role === 'Creative Director') {
      return res.status(403).json({ message: 'Directors have read-only access and cannot approve hours.' });
    }

    const { data: log, error: fetchError } = await supabase
      .from('hour_logs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !log) return res.status(404).json({ message: 'Log not found' });

    if (currentUser.is_test !== log.is_test) {
      return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    // Permission check
    const isHRMember = currentUser.department === 'HR' && currentUser.role === 'Member';

    if (isHRMember && currentUser.title?.startsWith('HR Coordinator')) {
      const { data: targetUser } = await supabase.from('profiles').select('department').eq('id', log.user_id).single();
      const coordDept = currentUser.title.split(' - ')[1];
      if (targetUser && targetUser.department !== coordDept && coordDept !== 'HR') {
        return res.status(403).json({ message: `You can only approve hours for ${coordDept} department.` });
      }
    } else if (isHRMember && currentUser.position === 'Team Leader' && currentUser.responsible_departments) {
      const { data: targetUser } = await supabase.from('profiles').select('department').eq('id', log.user_id).single();
      if (targetUser && !currentUser.responsible_departments.includes(targetUser.department)) {
        return res.status(403).json({ message: `You can only approve hours for your responsible departments: ${currentUser.responsible_departments.join(', ')}` });
      }
    } else if (currentUser.role === 'Member') {
      return res.status(403).json({ message: 'Members are not authorized to approve hours.' });
    }

    const { status } = req.body;
    const updateData: any = { status };

    if (status === 'Approved') {
      updateData.approved_by = currentUser.id;
      const { data: profile } = await supabase.from('profiles').select('hours_approved, points').eq('id', log.user_id).single();
      if (profile) {
        await supabase.from('profiles').update({
          hours_approved: (profile.hours_approved || 0) + log.amount,
          points: (profile.points || 0) + log.amount * 10,
        }).eq('id', log.user_id);
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('hour_logs')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * DELETE /api/hours/:id
 */
export const deleteHourLog = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;
    const logId = req.params.id;

    // 1. Fetch the log
    const { data: log, error: fetchError } = await supabase
      .from('hour_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (fetchError || !log) return res.status(404).json({ message: 'Log not found' });

    // 2. Permission check (Board or HR only)
    const canDelete = ['HR', 'General President', 'Vice President', 'Head', 'Vice Head'].includes(currentUser.role) || currentUser.department === 'HR';
    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete hour logs.' });
    }

    // 3. If approved, decrement the user's total hours/points
    if (log.status === 'Approved') {
      const { data: profile } = await supabase.from('profiles').select('hours_approved, points').eq('id', log.user_id).single();
      if (profile) {
        await supabase.from('profiles').update({
          hours_approved: Math.max(0, (profile.hours_approved || 0) - log.amount),
          points: Math.max(0, (profile.points || 0) - log.amount * 10),
        }).eq('id', log.user_id);
      }
    }

    // 4. Delete the log
    const { error: deleteError } = await supabase.from('hour_logs').delete().eq('id', logId);
    if (deleteError) throw deleteError;

    res.json({ message: 'Hour log deleted successfully' });
  } catch (error) {
    console.error('Delete hour log error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * POST /api/hours/recalculate
 */
export const recalculateUserHours = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;
    const { userId } = req.body;

    // Permission check (Board or HR only)
    const canRecalculate = ['HR', 'General President', 'Vice President'].includes(currentUser.role) || (currentUser.department === 'HR' && ['Head', 'Vice Head'].includes(currentUser.role));
    if (!canRecalculate) {
      return res.status(403).json({ message: 'Not authorized to recalculate hours.' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // 1. Fetch all approved logs for this user
    const { data: logs, error: logsError } = await supabase
      .from('hour_logs')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'Approved');

    if (logsError) throw logsError;

    // 2. Fetch all completed tasks for this user
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('score_value, task_hours')
      .eq('assigned_to', userId)
      .eq('status', 'Completed');

    if (tasksError) throw tasksError;

    // 3. Sum hours from logs
    const totalHours = (logs || []).reduce((sum, log) => sum + (log.amount || 0), 0);
    
    // 4. Sum points from tasks + hour-based points
    // Points = (hours * 10) + sum(task score values)
    const taskPoints = (tasks || []).reduce((sum, t) => sum + (Number(t.score_value) || 0), 0);
    const totalPoints = (totalHours * 10) + taskPoints;
    const tasksCompleted = (tasks || []).length;

    // 5. Update the profile
    const { error: updateError } = await supabase.from('profiles').update({
      hours_approved: Math.max(0, totalHours),
      points: Math.max(0, totalPoints),
      tasks_completed: Math.max(0, tasksCompleted)
    }).eq('id', userId);

    if (updateError) throw updateError;

    res.json({ 
      message: 'User profile synchronized successfully', 
      totalHours, 
      tasksCompleted, 
      totalPoints 
    });
  } catch (error) {
    console.error('Recalculate hours error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
