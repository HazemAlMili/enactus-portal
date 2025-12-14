// Import express types
import { Request, Response } from 'express';
// Import Task model
import Task from '../models/Task';
import User from '../models/User';

/**
 * Controller to create a new task.
 * Route: POST /api/tasks
 * Access: Private (Heads/VP/HR)
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    // Destructure task details from request body
    const { title, description, resourcesLink, deadline } = req.body;
    const currentUser = (req as any).user;

    if (!currentUser.department) {
       return res.status(400).json({ message: 'User must belong to a department to create tasks.' });
    }

    // Find all 'Member' users in the creator's department
    // Find all potential assignees in the department (Members and HRs, excluding self)
    const members = await User.find({ 
      department: currentUser.department, 
      role: { $in: ['Member', 'HR'] },
      _id: { $ne: currentUser._id } // Don't assign to self
    });

    if (!members || members.length === 0) {
      return res.status(400).json({ message: 'No members found in your department to assign tasks to.' });
    }
    
    // Create a task for each member
    const tasks = await Promise.all(members.map(member => Task.create({
      title: title || `${currentUser.department} Task - ${new Date().toLocaleDateString()}`,
      description,
      assignedTo: member._id,
      assignedBy: currentUser._id,
      department: currentUser.department,
      scoreValue: 50, // Default XP Reward
      resourcesLink,
      deadline
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
        query = {}; // GP and VP see all tasks
    }
    else if (userRole === 'Operation Director') {
        // Responsible for PR, FR, Logistics, PM
        query = { department: { $in: ['PR', 'FR', 'Logistics', 'PM'] } };
    }
    else if (userRole === 'Creative Director') {
        // Responsible for Marketing, Multi-Media, Presentation, Organization
        query = { department: { $in: ['Marketing', 'Multi-Media', 'Presentation', 'Organization'] } };
    }

    // Retrieve tasks, populating assignee and assigner details
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });
      
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

    // Handle Status Updates
    if (req.body.status) {
        
        // If Approved (Completed)
        if (req.body.status === 'Completed' && task.status !== 'Completed') {
             // Logic for completion: just update status. 
             // Scores are NOT added automatically as per request.
        }
        
        // If Rejected
        if (req.body.status === 'Rejected') {
             // Logic for rejection
        }

        task.status = req.body.status;
    }

    if (req.body.submissionLink) task.submissionLink = req.body.submissionLink;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
