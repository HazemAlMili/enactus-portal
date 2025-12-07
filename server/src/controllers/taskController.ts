import { Request, Response } from 'express';
import Task from '../models/Task';

// Create Task
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, assignedTo, scoreValue, dueDate } = req.body;
    
    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: (req.user as any)?._id,
      scoreValue,
      dueDate
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Tasks
export const getTasks = async (req: Request, res: Response) => {
  try {
    let query = {};
    // If member, only see assigned tasks
    if (req.user?.role === 'Member') {
      query = { assignedTo: (req.user as any)._id };
    } 
    // If Head/VP, see department tasks (Need to filter users by dept first or store dept on task, 
    // but easier to just filter tasks where assignedTo user is in dept? 
    // For simplicity, let's assume Head can see all tasks they assigned OR tasks for their dept members).
    // The PRD says "Head... Ability to assign and review tasks".
    // I'll filter by assignedBy for Heads for now, or all tasks if they want to see what others assigned?
    // Let's create a simpler logic: Heads see tasks they created + tasks assigned to them?
    
    // Better: Filter by Department of the user assignedTo? 
    // That requires a join. 
    // Let's just return all for HR/GP, and for others filter by assignedTo = me OR assignedBy = me.
    else if (req.user?.role === 'Head' || req.user?.role === 'Vice Head') {
       query = { $or: [{ assignedBy: (req.user as any)._id }, { assignedTo: (req.user as any)._id }] };
    }

    const tasks = await Task.find(query).populate('assignedTo', 'name email').populate('assignedBy', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update Task (Submit / Approve)
export const updateTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Updates
    if (req.body.status) task.status = req.body.status;
    if (req.body.submissionLink) task.submissionLink = req.body.submissionLink;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
