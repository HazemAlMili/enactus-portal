// Import express types
import { Request, Response } from 'express';
// Import HourLog and User models
import HourLog from '../models/HourLog';
import User from '../models/User';

/**
 * Controller to submit hours.
 * Route: POST /api/hours
 * Access: Private
 */
export const submitHours = async (req: Request, res: Response) => {
  try {
    const { amount, description, date } = req.body;
    // Create a new hour log
    const hourLog = await HourLog.create({
      user: (req.user as any)?._id, // Associated with current user
      amount,
      description,
      date,
      status: 'Pending' // Default to pending approval
    });
    res.status(201).json(hourLog);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to get hours history.
 * Route: GET /api/hours
 * Access: Private
 */
export const getHours = async (req: Request, res: Response) => {
  try {
    let query = {};
    // Members see only their own hours
    if (req.user?.role === 'Member') {
      query = { user: (req.user as any)._id };
    } else if (req.user?.role === 'Head' || req.user?.role === 'Vice Head') {
      // Leaders can see all hours for now (to approve them)
      // Future improvement: filter by department
    }

    // Fetch logs, populating user details
    const logs = await HourLog.find(query).populate('user', 'name role department');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to update hour status (Approve/Reject).
 * Route: PUT /api/hours/:id
 * Access: Private (Head/HR)
 */
export const updateHourStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const log = await HourLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    // Update status and set who approved it
    log.status = status;
    if (status === 'Approved') {
      log.approvedBy = (req.user as any)?._id;
      
      // Update User stats (Total hours and Points)
      const user = await User.findById(log.user);
      if (user) {
        user.hoursApproved += log.amount;
        user.points += log.amount * 10; // Award 10 points per hour approved
        await user.save();
      }
    }
    
    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
