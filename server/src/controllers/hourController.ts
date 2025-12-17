// Import express types
import { Request, Response } from 'express';
// Import HourLog and User models
import HourLog from '../models/HourLog';
import User from '../models/User';
import HighBoard from '../models/HighBoard';

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

    // Check if Leaders are assigning hours to others (Restricted to HR Only or Board)
    // Check if Leaders are assigning hours to others (Restricted to HR Only or Board)
    // Also HR Coordinators (Members in HR dept with title 'HR Coordinator - DEPT')
    const isHRCoordinator = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator');
    const canGiveHours = ['HR', 'General President', 'Vice President'].includes(currentUser.role) || currentUser.department === 'HR' || isHRCoordinator;

     if (targetUserId && canGiveHours) {
       // Validate: If target user is in HR department, ONLY HR Head can add approved hours for them
       const targetUser = await User.findById(targetUserId);
       
       if (targetUser && targetUser.department === 'HR' && currentUser.role !== 'Head' && currentUser.department === 'HR') {
           // If the current user is NOT the HR Head (e.g. is an HR Coordinator/Member), they cannot APPROVE hours for other HR members/themselves directly
           // But actually the user request says: "HR head ONLY Add hours for his department members"
           // This implies HR Coordinators cannot add hours for themselves or each other? 
           // Or does it mean ONLY HR head can add for HR members, preventing other HR coordinators from adding for HR members?
           
           // Based on "HRs coordinator don't have who added them houres":
           // This means HR Coordinators need someone to add hours for them. That someone is the HR Head.
           
           // So if target is HR department, current user MUST be HR Head (or Board/President).
           if (currentUser.role !== 'Head' && currentUser.role !== 'General President' && currentUser.role !== 'Vice President') {
               return res.status(403).json({ message: 'Only the HR Head can add hours for HR Department members.' });
           }
       }
       
       // HR Coordinator Check: Can only add hours for THEIR specific department
       if (isHRCoordinator) {
           // Parse department from title: "HR Coordinator - IT" -> "IT"
           const coordDept = currentUser.title.split(' - ')[1];
           if (coordDept && targetUser && targetUser.department !== coordDept) {
               return res.status(403).json({ message: `You are authorized to add hours only for the ${coordDept} department.` });
           }
       }

       logData.user = targetUserId;
       logData.status = 'Approved';
       logData.approvedBy = currentUser._id;
       
       // Update the Target User's stats immediately
       if (targetUser) {
         targetUser.hoursApproved += Number(amount);
         targetUser.points += Number(amount) * 10;
         await targetUser.save();
       }
    } else {
       // Regular submission for self
       logData.user = currentUser._id;
       
       // Auto-approve for Leaders logging their own hours (Only HR/Board)
       if (['HR', 'General President', 'Vice President'].includes(currentUser.role)) {
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
    
    // 1. HR Member (Coordinator) Logic - CHECK FIRST! (before general Member check)
    // HR Coordinators have role='Member' but special title
    if (currentUser?.department === 'HR' && currentUser?.role === 'Member') {
         // Check title for responsibility
         if (currentUser.title?.startsWith('HR Coordinator')) {
             const coordDept = currentUser.title.split(' - ')[1];
             if (coordDept) {
                 const userDept = await User.find({ department: coordDept }).select('_id');
                 const highboardDept = await HighBoard.find({ department: coordDept }).select('_id');
                 const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
                 query = { user: { $in: allDeptUsers } };
             } else {
                 // Fallback: See own hours
                 query = { user: currentUser._id };
             }
         } else {
             // Regular HR member (if any): See own hours
             query = { user: currentUser._id };
         }
    }
    // 2. Regular Members: See ONLY their own hours
    else if (currentUser?.role === 'Member') {
      query = { user: currentUser._id };
    } 
    // 3. Head / Vice Head: See hours for their Department members
    else if (currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') {
      // Check BOTH User and HighBoard collections
      const userDept = await User.find({ department: currentUser.department }).select('_id');
      const highboardDept = await HighBoard.find({ department: currentUser.department }).select('_id');
      const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
      query = { user: { $in: allDeptUsers } };
    }
    // 4. Operation Director
    else if (currentUser?.role === 'Operation Director') {
         const userDept = await User.find({ department: { $in: ['PR', 'FR', 'Logistics', 'PM'] } }).select('_id');
         const highboardDept = await HighBoard.find({ department: { $in: ['PR', 'FR', 'Logistics', 'PM'] } }).select('_id');
         const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
         query = { user: { $in: allDeptUsers } };
    }
    // 5. Creative Director
    else if (currentUser?.role === 'Creative Director') {
         const userDept = await User.find({ department: { $in: ['Marketing', 'Multi-Media', 'Presentation', 'Organization'] } }).select('_id');
         const highboardDept = await HighBoard.find({ department: { $in: ['Marketing', 'Multi-Media', 'Presentation', 'Organization'] } }).select('_id');
         const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
         query = { user: { $in: allDeptUsers } };
    }
    // 6. HR Logic (role='HR', not Member)
    else if (currentUser?.role === 'HR') {
      // Check if this is a specific HR Coordinator (e.g., hr-it@enactus.com)
      const email = currentUser.email || '';
      const hrMatch = email.match(/^hr-(.+)@/); // Matches hr-it, hr-pm, etc.
      
      if (hrMatch) {
         // This is an HR Coordinator for a specific department
         const targetDept = hrMatch[1].toUpperCase().replace('MULTIMEDIA', 'Multi-Media'); // normalize if needed
         
         const validDepts = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
         const deptName = validDepts.find(d => d.replace(/[^a-zA-Z]/g, '').toLowerCase() === targetDept.replace(/[^a-zA-Z]/g, '').toLowerCase()) || targetDept;

         const userDept = await User.find({ department: deptName }).select('_id');
         const highboardDept = await HighBoard.find({ department: deptName }).select('_id');
         const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
         query = { user: { $in: allDeptUsers } };
      } else {
         // General HR (hr@enactus.com) - Sees All or filters via query
         // Current behavior for General HR: Default All
         const { department } = req.query;
         if (department && department !== 'All') {
            const userDept = await User.find({ department }).select('_id');
            const highboardDept = await HighBoard.find({ department }).select('_id');
            const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
            query = { user: { $in: allDeptUsers } };
         }
      }
    }
    // 7. General President / VP: Sees ALL (can filter)
    else if (['General President', 'Vice President'].includes(currentUser?.role)) {
      const { department } = req.query;
      if (department && department !== 'All') {
        const userDept = await User.find({ department }).select('_id');
        const highboardDept = await HighBoard.find({ department }).select('_id');
        const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
        query = { user: { $in: allDeptUsers } };
      }
    }

    // Fetch logs, populating user details
    const logs = await HourLog.find(query)
      .populate('user', 'name role department')
      .sort({ createdAt: -1 })
      .lean(); // ⚡ Plain objects - faster
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
