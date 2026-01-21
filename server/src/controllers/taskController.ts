// Import express types
import { Request, Response } from 'express';
// Import Task model
import Task from '../models/Task';
import User from '../models/User';
import HourLog from '../models/HourLog';
// Import validation utilities
import { validate, createTaskSchema, submitTaskSchema, updateTaskSchema } from '../lib/validation';

/**
 * Controller to create a new task.
 * Route: POST /api/tasks
 * Access: Private (Heads/VP/HR)
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    // ✅ VALIDATE INPUT DATA (M0 Optimization - Prevent Junk Data)
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

    // Destructure task details from validated body
    const { title, description, resourcesLink, deadline, taskHours, team, targetPosition } = validationResult.data;
    const currentUser = (req as any).user;

    if (!currentUser.department) {
       return res.status(400).json({ message: 'User must belong to a department to create tasks.' });
    }

    // Build query for finding members
    const query: any = {
      department: currentUser.department, 
      role: { $in: ['Member', 'HR'] },
      _id: { $ne: currentUser._id } // Don't assign to self
    };

    // If team is specified, filter by team
    if (team) {
      query.team = team;
    }

    // If targetPosition is specified and NOT 'Both', filter by position
    if (targetPosition && targetPosition !== 'Both') {
      query.position = targetPosition;
    }

    // ISOLATION: Test accounts only assign to other test accounts
    if (currentUser?.isTest) {
      query.isTest = true;
    } else {
      query.isTest = { $ne: true };
    }

    // Find all potential assignees in the department (and team if specified)
    const members = await User.find(query);

    if (!members || members.length === 0) {
      const teamMsg = team ? ` in team "${team}"` : '';
      return res.status(400).json({ message: `No members found in your department${teamMsg} to assign tasks to.` });
    }
    
    // Generate a unique group ID for this batch of tasks
    const taskGroupId = new (require('mongoose').Types.ObjectId)().toString();
    
    // Create a task for each member with the same taskGroupId
    const tasks = await Promise.all(members.map(member => Task.create({
      title: title || `${currentUser.department} Task - ${new Date().toLocaleDateString()}`,
      description,
      assignedTo: member._id,
      assignedBy: currentUser._id,
      assignedByModel: ['Head', 'Vice Head', 'General President', 'Vice President', 'Operation Director', 'Creative Director'].includes(currentUser.role) ? 'HighBoard' : 'User',
      department: currentUser.department,
      team: team || undefined, // Store team if specified
      targetPosition: targetPosition || 'Both',
      scoreValue: 50, // Default XP Reward
      resourcesLink: resourcesLink || [], // Multiple resource links
      deadline,
      taskHours: taskHours || 0, // Hours awarded on completion (hidden from members)
      taskGroupId, // All tasks in this batch share the same group ID
      isTest: currentUser?.isTest || false
    })));

    // Return the created tasks
    res.status(201).json(tasks);
  } catch (error) {
    // Handle server errors
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to get a list of tasks based on user role.
 * Route: GET /api/tasks
 * Access: Private
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    let query = {};
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?._id;
    const userDept = (req as any).user?.department;

    // Logic to determine which tasks to return based on role
    if (userRole === 'Member') {
      // Members only see tasks assigned to them
      query = { assignedTo: userId };
    } 
    else if (userRole === 'Head' || userRole === 'Vice Head') {
       // Heads/VPs see tasks they assigned OR tasks assigned to them (if any)
       query = { department: userDept };
    }
    else if (userRole === 'HR') {
      // HR sees tasks assigned TO them (as a worker) OR tasks BY them (as a recruiter/manager)
      query = { 
        $or: [
            { assignedTo: userId },
            { assignedBy: userId, department: userDept } // Ensure department match for safety
        ]
      };
    }
    else if (['General President', 'Vice President'].includes(userRole)) {
        // GP and VP are also PM Heads - only see PM department tasks
        query = { department: 'PM' };
    }
    else if (userRole === 'Operation Director') {
        // Responsible for PR, FR, Logistics, PM
        query = { department: { $in: ['PR', 'FR', 'Logistics', 'PM'] } };
    }
    else if (userRole === 'Creative Director') {
        // Responsible for Marketing, Multi-Media, Presentation, Organization
        query = { department: { $in: ['Marketing', 'Multi-Media', 'Presentation', 'Organization'] } };
    }

    // ISOLATION LOGIC: Test users only see test tasks
    const currentUser = (req as any).user;
    if (currentUser?.isTest) {
      (query as any).isTest = true;
    } else {
      (query as any).isTest = { $ne: true };
    }

    // Retrieve tasks, populating assignee and assigner details
    const tasks = await Task.find(query)
      .select('title description status assignedTo assignedBy department deadline scoreValue resourcesLink submissionLink createdAt taskGroupId')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 })
      .lean(); // ⚡ Returns plain objects - faster than Mongoose docs
      
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to update a task (e.g. for submission or approval/status change).
 * Route: PUT /api/tasks/:id
 * Access: Private
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // ISOLATION: Test accounts can only update test tasks
    const currentUser = (req as any).user;
    if (currentUser?.isTest !== task.isTest) {
        return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    // ✅ VALIDATE UPDATE DATA (M0 Optimization)
    const validationResult = validate(updateTaskSchema, req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid update data',
        errors: validationResult.errors.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Handle Status Updates
    if (req.body.status) {
        
        // If Approved (Completed)
        if (req.body.status === 'Completed' && task.status !== 'Completed') {
             // ✨ AUTOMATIC HOURS REWARD
             // When Head approves task, member automatically gets hours
             if (task.taskHours && task.taskHours > 0) {
               const member = await User.findById(task.assignedTo);
               if (member) {
                 member.hoursApproved += task.taskHours;
                 member.points += task.taskHours * 10; // 10 points per hour
                 await member.save();
                 
                 // ✅ CREATE HOUR LOG ENTRY FOR TRACKING
                 // This shows task completion history in Hours page
                 const currentUser = (req as any).user;
                 await HourLog.create({
                   user: task.assignedTo,
                   amount: task.taskHours,
                   description: `${task.title} - Submitted: ${new Date(task.updatedAt || Date.now()).toLocaleDateString()}`,
                   status: 'Approved', // Auto-approved
                   approvedBy: currentUser._id,
                   date: new Date(),
                   isTest: task.isTest || false
                 });
                 
                 console.log(`✅ Auto-rewarded ${task.taskHours} hours to ${member.name} for task: ${task.title}`);
               }
             }
        }
        
        // If Rejected
        if (req.body.status === 'Rejected') {
             // Logic for rejection - no hours awarded
        }

        task.status = req.body.status;
    }

    if (req.body.submissionLink) task.submissionLink = req.body.submissionLink; // Can be array

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to edit task details (title, description, resources, deadline, hours).
 * Route: PUT /api/tasks/:id/edit
 * Access: Private (Task Creator Only)
 */
export const editTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const currentUser = (req as any).user;
    
    // ISOLATION: Test accounts can only edit test tasks
    if (currentUser?.isTest !== task.isTest) {
        return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    // AUTHORIZATION: Only the creator can edit
    if (task.assignedBy.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ message: 'Only the task creator can edit this task.' });
    }

    // Update allowed fields
    const { title, description, resourcesLink, deadline, taskHours, team } = req.body;
    
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (resourcesLink !== undefined) task.resourcesLink = resourcesLink;
    if (deadline !== undefined) task.deadline = deadline;
    if (taskHours !== undefined) task.taskHours = taskHours;
    if (team !== undefined) task.team = team;

    await task.save();
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to delete a task.
 * Route: DELETE /api/tasks/:id
 * Access: Private (Task Creator Only)
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const currentUser = (req as any).user;
    
    // ISOLATION: Test accounts can only delete test tasks
    if (currentUser?.isTest !== task.isTest) {
        return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    // AUTHORIZATION: Only the creator can delete
    if (task.assignedBy.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ message: 'Only the task creator can delete this task.' });
    }

    await task.deleteOne();
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
