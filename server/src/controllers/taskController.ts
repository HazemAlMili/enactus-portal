// Import express types
import { Request, Response } from 'express';
// Import Task model
import Task from '../models/Task';

/**
 * Controller to create a new task.
 * Route: POST /api/tasks
 * Access: Private (Heads/VP/HR)
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    // Destructure task details from request body
    const { title, description, resourcesLink } = req.body;
    const currentUser = (req as any).user;

    // Find all 'Member' users in the creator's department
    const members = await User.find({ 
      department: currentUser.department, 
      role: 'Member' 
    });

    if (!members || members.length === 0) {
      return res.status(400).json({ message: 'No members found in your department to assign tasks to.' });
    }
    
    // Create a task for each member
    const tasks = await Promise.all(members.map(member => Task.create({
      title,
      description,
      assignedTo: member._id,
      assignedBy: currentUser._id,
      scoreValue: 50, // Default XP Reward
      resourcesLink
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

    // Logic to determine which tasks to return based on role
    if (userRole === 'Member') {
      // Members only see tasks assigned to them
      query = { assignedTo: userId };
    } 
    else if (userRole === 'Head' || userRole === 'Vice Head') {
       // Heads/VPs see tasks they assigned OR tasks assigned to them
       query = { $or: [{ assignedBy: userId }, { assignedTo: userId }] };
    }
    // Note: Other roles (e.g. HR, GP) might see all tasks or default to empty query (seeing all) depending on implementation details not fully specified here, effectively showing all if query remains {}.

    // Retrieve tasks, populating assignee and assigner details
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name');
      
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to update a task (e.g. for submission or approval/status change).
 * Route: PUT /api/tasks/:id
 * Access: Private
 */
import User from '../models/User';

// ... (existing imports)

export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Check if status is changing to Completed
    if (req.body.status === 'Completed' && task.status !== 'Completed') {
       const user = await User.findById(task.assignedTo);
       if (user) {
         user.tasksCompleted += 1;
         user.points += (task.scoreValue || 0);
         await user.save();
       }
    }

    if (req.body.status) task.status = req.body.status;
    if (req.body.submissionLink) task.submissionLink = req.body.submissionLink;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
