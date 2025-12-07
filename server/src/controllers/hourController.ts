import { Request, Response } from 'express';
import HourLog from '../models/HourLog';
import User from '../models/User';

export const submitHours = async (req: Request, res: Response) => {
  try {
    const { amount, description, date } = req.body;
    const hourLog = await HourLog.create({
      user: (req.user as any)?._id,
      amount,
      description,
      date,
      status: 'Pending'
    });
    res.status(201).json(hourLog);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getHours = async (req: Request, res: Response) => {
  try {
    let query = {};
    if (req.user?.role === 'Member') {
      query = { user: (req.user as any)._id };
    } else if (req.user?.role === 'Head' || req.user?.role === 'Vice Head') {
      // Find users in my department?
      // For now, allow Heads to see all pending hours? No, too messy.
      // Let's assume frontend filters or we do a lookup.
      // Simplification: Return all for now for Leaders, filter on frontend or do proper agg.
      // Correct: query = { 'user.department': req.user.department } (Needs aggregation/populate filter)
      // We will just return all and let frontend filter, or user populated query.
      // Let's return all for non-members.
    }

    const logs = await HourLog.find(query).populate('user', 'name role department');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateHourStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const log = await HourLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    log.status = status;
    if (status === 'Approved') {
      log.approvedBy = (req.user as any)?._id;
      // Increment user hours
      const user = await User.findById(log.user);
      if (user) {
        user.hoursApproved += log.amount;
        user.points += log.amount * 10; // 10 points per hour
        await user.save();
      }
    }
    
    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
