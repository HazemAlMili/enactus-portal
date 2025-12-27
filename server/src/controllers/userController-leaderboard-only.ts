import { Request, Response } from 'express';
import User from '../models/User';
import HighBoard from '../models/HighBoard';
import dbConnect from '../lib/dbConnect';

export const getLeaderboard = async (req: Request, res: Response) => {
  const startTime = Date.now();
  await dbConnect();
  console.log(`⏱️ DB Connect: ${Date.now() - startTime}ms`);
  
  try {
    const currentUser = (req as any).user;
    const testFilter = currentUser?.isTest ? { isTest: true } : { isTest: { $ne: true } };
    
    const queryStart = Date.now();
    
    // Simpler, faster query - just get top 20
    const users = await User.find({ role: 'Member', ...testFilter })
      .select('name hoursApproved department')
      .sort({ hoursApproved: -1 })
      .limit(20)
      .lean()
      .exec();
    
    console.log(`⏱️ Query time: ${Date.now() - queryStart}ms`);
    console.log(`📊 Found ${users.length} users`);
    console.log(`⏱️ Total time: ${Date.now() - startTime}ms`);
    
    res.json(users);
  } catch (error) {
    console.error('❌ Leaderboard error:', error);
    res.status(500).json({ message: 'Server Error', error: String(error) });
  }
};
