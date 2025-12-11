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
    const { title, description, assignedTo, scoreValue, dueDate } = req.body;
    
    // Create a new task in the database
    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: (req.user as any)?._id, // Set the creator (current user) as assigner
      scoreValue,
      dueDate
    });

    // Return the created task with 201 Created status
    res.status(201).json(task);
  } catch (error) {
    // Handle server errors
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
    const userRole = req.user?.role;
    const userId = (req.user as any)._id;

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
export const updateTask = async (req: Request, res: Response) => {
  try {
    // Find task by ID
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Update fields if they are present in the request body
    if (req.body.status) task.status = req.body.status;
    if (req.body.submissionLink) task.submissionLink = req.body.submissionLink;

    // Save the updated task
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
