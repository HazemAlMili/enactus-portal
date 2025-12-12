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
    const { amount, description, date, targetUserId } = req.body;
    const currentUser = (req as any).user;
    
    let logData: any = {
      amount,
      description,
      date,
    };

    // Check if Leaders are assigning hours to others
    if (targetUserId && ['Head', 'Vice Head', 'HR', 'General President'].includes(currentUser.role)) {
       logData.user = targetUserId;
       logData.status = 'Approved';
       logData.approvedBy = currentUser._id;
       
       // Update the Target User's stats immediately
       const targetUser = await User.findById(targetUserId);
       if (targetUser) {
         targetUser.hoursApproved += Number(amount);
         targetUser.points += Number(amount) * 10;
         await targetUser.save();
       }
    } else {
       // Regular submission for self
       logData.user = currentUser._id;
       
       // Auto-approve for Leaders logging their own hours
       if (['Head', 'Vice Head', 'HR', 'General President'].includes(currentUser.role)) {
          logData.status = 'Approved';
          logData.approvedBy = currentUser._id;
          
          // Update own stats
          const selfUser = await User.findById(currentUser._id);
          if (selfUser) {
             selfUser.hoursApproved += Number(amount);
             selfUser.points += Number(amount) * 10;
             await selfUser.save();
          }
       } else {
          logData.status = 'Pending';
       }
    }

    // Create a new hour log
    const hourLog = await HourLog.create(logData);

    res.status(201).json(hourLog);
  } catch (error) {
    console.error(error);
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
    let query: any = {};
    const currentUser = (req as any).user;
    
    // 1. Members: See ONLY their own hours
    if (currentUser?.role === 'Member') {
      query = { user: currentUser._id };
    } 
    // 2. Head / Vice Head: See hours for their Department members
    else if (currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') {
      const deptUsers = await User.find({ department: currentUser.department }).select('_id');
      query = { user: { $in: deptUsers.map(u => u._id) } };
    }
    // 3. HR Logic
    else if (currentUser?.role === 'HR') {
      // Check if this is a specific HR Coordinator (e.g., hr-it@enactus.com)
      const email = currentUser.email || '';
      const hrMatch = email.match(/^hr-(.+)@/); // Matches hr-it, hr-pm, etc.
      
      if (hrMatch) {
         // This is an HR Coordinator for a specific department
         const targetDept = hrMatch[1].toUpperCase().replace('MULTIMEDIA', 'Multi-Media'); // normalize if needed
         
         // Find users in that target department
         // But wait, the department name in DB might be 'Multi-Media' but email 'hr-multimedia'. 
         // For now assuming simple tokens match (IT, PM, PR). 
         
         // Fuzzy match or exact match from DB? 
         // Let's rely on the department list normalized.
         const validDepts = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
         const deptName = validDepts.find(d => d.replace(/[^a-zA-Z]/g, '').toLowerCase() === targetDept.replace(/[^a-zA-Z]/g, '').toLowerCase()) || targetDept;

         const deptUsers = await User.find({ department: deptName }).select('_id');
         query = { user: { $in: deptUsers.map(u => u._id) } };
      } else {
         // General HR (hr@enactus.com) - Sees All or filters via query
         // Current behavior for General HR: Default All
         const { department } = req.query;
         if (department && department !== 'All') {
            const deptUsers = await User.find({ department }).select('_id');
            query = { user: { $in: deptUsers.map(u => u._id) } };
         }
      }
    }
    // 4. General President: Sees ALL
    else if (currentUser?.role === 'General President') {
      const { department } = req.query;
      if (department && department !== 'All') {
        const deptUsers = await User.find({ department }).select('_id');
        query = { user: { $in: deptUsers.map(u => u._id) } };
      }
    }

    // Fetch logs, populating user details
    const logs = await HourLog.find(query).populate('user', 'name role department').sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error(error);
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
      log.approvedBy = (req as any).user?._id;
      
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
