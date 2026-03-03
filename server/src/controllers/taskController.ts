// server/src/controllers/taskController.ts
// Fully rewritten to use Supabase instead of Mongoose.

import { Request, Response } from 'express';
import getSupabaseAdmin from '../lib/supabaseAdmin';
import { validate, createTaskSchema, submitTaskSchema, updateTaskSchema } from '../lib/validation';
import { randomUUID } from 'crypto';

/**
 * POST /api/tasks
 * Creates tasks for all matching members in the department.
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const validationResult = validate(createTaskSchema, req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid task data',
        errors: validationResult.errors.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    const { title, description, resourcesLink, deadline, taskHours, team, targetPosition } = validationResult.data;
    const currentUser = (req as any).user;
    const supabase = getSupabaseAdmin();

    if (!currentUser.department) {
      return res.status(400).json({ message: 'User must belong to a department to create tasks.' });
    }

    // Find members to assign to
    let membersQuery = supabase
      .from('profiles')
      .select('id')
      .in('role', ['Member', 'HR'])
      .eq('department', currentUser.department)
      .neq('id', currentUser.id);

    if (team) membersQuery = membersQuery.eq('team', team);
    if (targetPosition && targetPosition !== 'Both') membersQuery = membersQuery.eq('position', targetPosition);

    if (currentUser.is_test) {
      membersQuery = membersQuery.eq('is_test', true);
    } else {
      membersQuery = membersQuery.neq('is_test', true);
    }

    const { data: members, error: membersError } = await membersQuery;
    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      const teamMsg = team ? ` in team "${team}"` : '';
      return res.status(400).json({ message: `No members found in your department${teamMsg} to assign tasks to.` });
    }

    const taskGroupId = randomUUID();

    const tasksToCreate = members.map((member: any) => ({
      title: title || `${currentUser.department} Task - ${new Date().toLocaleDateString()}`,
      description,
      assigned_to: member.id,
      assigned_by: currentUser.id,
      department: currentUser.department,
      team: team || null,
      target_position: targetPosition || 'Both',
      score_value: 50,
      resources_link: resourcesLink || [],
      deadline: deadline || null,
      task_hours: taskHours || 0,
      task_group_id: taskGroupId,
      is_test: currentUser.is_test || false,
    }));

    const { data: tasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToCreate)
      .select();

    if (insertError) throw insertError;

    res.status(201).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * GET /api/tasks
 * Returns tasks based on user role.
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;
    const userId = currentUser.id;
    const userRole = currentUser.role;
    const userDept = currentUser.department;

    // Build base query with joins for populated fields
    let query = supabase
      .from('tasks')
      .select(`
        id, title, description, status, department, deadline,
        score_value, task_hours, resources_link, submission_link, created_at, task_group_id,
        assigned_to ( id, name, email ),
        assigned_by ( id, name )
      `)
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (currentUser.department === 'HR' && currentUser.position === 'Team Leader' && currentUser.responsible_departments?.length > 0) {
      const visibleDepts = [...(currentUser.responsible_departments || []), currentUser.department];
      query = query.in('department', visibleDepts);
    } else if (currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator')) {
      const coordDept = currentUser.title.split(' - ')[1];
      if (coordDept) {
        query = query.or(`department.eq.${coordDept},assigned_to.eq.${userId}`);
      } else {
        query = query.eq('assigned_to', userId);
      }
    } else if (userRole === 'Member') {
      query = query.eq('assigned_to', userId);
    } else if (userRole === 'Head' || userRole === 'Vice Head') {
      query = query.eq('department', userDept);
    } else if (userRole === 'HR') {
      query = query.or(`assigned_to.eq.${userId},and(assigned_by.eq.${userId},department.eq.${userDept})`);
    } else if (['General President', 'Vice President'].includes(userRole)) {
      query = query.eq('department', 'PM');
    } else if (userRole === 'Operation Director') {
      query = query.in('department', ['PR', 'FR', 'Logistics', 'PM']);
    } else if (userRole === 'Creative Director') {
      query = query.in('department', ['Marketing', 'Multi-Media', 'Presentation', 'Organization']);
    }

    // Isolation
    if (currentUser.is_test) {
      query = query.eq('is_test', true);
    } else {
      query = query.neq('is_test', true);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    // Deduplication (same logic as before — keep highest-priority status per user+mission)
    const statusPriority: Record<string, number> = { 'Completed': 4, 'Rejected': 3, 'Submitted': 2, 'Pending': 1 };
    const uniqueMap = new Map<string, any>();

    (tasks || []).forEach((t: any) => {
      const assigneeId = t.assigned_to?.id || t.assigned_to || 'unassigned';
      const key = `${assigneeId}|${t.title?.trim()}|${t.description?.trim()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, t);
      } else {
        const existing = uniqueMap.get(key);
        if ((statusPriority[t.status] || 0) > (statusPriority[existing.status] || 0)) {
          uniqueMap.set(key, t);
        }
      }
    });

    const mappedTasks = Array.from(uniqueMap.values()).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      department: t.department,
      deadline: t.deadline,
      scoreValue: t.score_value,
      taskHours: t.task_hours,
      resourcesLink: t.resources_link,
      submissionLink: t.submission_link,
      createdAt: t.created_at,
      taskGroupId: t.task_group_id,
      assignedTo: t.assigned_to,
      assignedBy: t.assigned_by
    }));

    res.json(mappedTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * PUT /api/tasks/:id
 * Update task status (submit / approve / reject).
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !task) return res.status(404).json({ message: 'Task not found' });

    if (currentUser.is_test !== task.is_test) {
      return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    const validationResult = validate(updateTaskSchema, req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid update data',
        errors: validationResult.errors.issues.map((err: any) => ({
          field: err.path.join('.'), message: err.message
        }))
      });
    }

    const updateData: any = {};

    if (req.body.status) {
      updateData.status = req.body.status;

      // Auto-reward logic when task is Completed
      if (req.body.status === 'Completed' && task.status !== 'Completed') {
        // Get current member stats
        const { data: member } = await supabase
          .from('profiles')
          .select('hours_approved, points, tasks_completed')
          .eq('id', task.assigned_to)
          .single();

        if (member) {
          const hoursToReward = task.task_hours || 0;
          const newHours = (member.hours_approved || 0) + hoursToReward;
          // Points: task hours * 10 + flat score value
          const newPoints = (member.points || 0) + (hoursToReward * 10) + (task.score_value || 0);
          const newTasksCompleted = (member.tasks_completed || 0) + 1;

          await supabase
            .from('profiles')
            .update({ hours_approved: newHours, points: newPoints, tasks_completed: newTasksCompleted })
            .eq('id', task.assigned_to);

          if (hoursToReward > 0) {
            // Create automatic hour log entry
            await supabase.from('hour_logs').insert({
              user_id: task.assigned_to,
              amount: hoursToReward,
              description: `${task.title} - Task completed`,
              status: 'Approved',
              approved_by: currentUser.id,
              date: new Date().toISOString(),
              is_test: task.is_test || false,
            });
            console.log(`✅ Auto-rewarded ${hoursToReward} hours for task: ${task.title}`);
          }
        }
      }
    }

    if (req.body.submissionLink) updateData.submission_link = req.body.submissionLink;

    const { data: updated, error: updateError } = await supabase
      .from('tasks')
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
 * PUT /api/tasks/:id/edit
 */
export const editTask = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !task) return res.status(404).json({ message: 'Task not found' });

    if (currentUser.is_test !== task.is_test) {
      return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    if (task.assigned_by !== currentUser.id) {
      return res.status(403).json({ message: 'Only the task creator can edit this task.' });
    }

    const { title, description, resourcesLink, deadline, taskHours, team } = req.body;
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (resourcesLink !== undefined) updateData.resources_link = resourcesLink;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (taskHours !== undefined) updateData.task_hours = taskHours;
    if (team !== undefined) updateData.team = team;

    const { data: updated, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const currentUser = (req as any).user;

    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !task) return res.status(404).json({ message: 'Task not found' });

    if (currentUser.is_test !== task.is_test) {
      return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    if (task.assigned_by !== currentUser.id) {
      return res.status(403).json({ message: 'Only the task creator can delete this task.' });
    }

    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
