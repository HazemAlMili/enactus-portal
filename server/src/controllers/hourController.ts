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
      isTest: currentUser?.isTest || false
    };

    // Check if Leaders are assigning hours to others (Restricted to HR Only or Board)
    // Also HR Coordinators (Members in HR dept with title 'HR Coordinator - DEPT')
    // Also HR Team Leaders (Members in HR dept with position 'Team Leader' and responsibleDepartments)
    const isHRCoordinator = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator');
    const isTeamLeader = currentUser.role === 'Member' &&  currentUser.department === 'HR' && currentUser.position === 'Team Leader' && currentUser.responsibleDepartments && currentUser.responsibleDepartments.length > 0;
    const canGiveHours = ['HR', 'General President', 'Vice President'].includes(currentUser.role) || currentUser.department === 'HR' || isHRCoordinator || isTeamLeader;

     if (targetUserId && canGiveHours) {
       // Validate: If target user is in HR department, ONLY HR Head can add approved hours for them
       const targetUser = await User.findById(targetUserId);
       
       // 🔐 CRITICAL ISOLATION CHECK: Prevent visitor from affecting real users
       if (targetUser && currentUser?.isTest !== targetUser.isTest) {
           return res.status(403).json({ message: 'Security Breach: Isolation mismatch. Cannot approve hours across test/real boundary.' });
       }
       
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

       // HR Team Leader Check: Can only add hours for members in their responsible departments
       if (isTeamLeader) {
           if (targetUser && !currentUser.responsibleDepartments.includes(targetUser.department)) {
               return res.status(403).json({ message: `You are authorized to add hours only for members in: ${currentUser.responsibleDepartments.join(', ')}` });
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

    // ISOLATION LOGIC
    const testFilter = currentUser?.isTest ? { isTest: true } : { isTest: { $ne: true } };
    
    // 1. HR Team Leader Logic - CHECK FIRST! (before HR Coordinator check)
    if (currentUser?.role === 'Member' && currentUser?.department === 'HR' && currentUser?.position === 'Team Leader' && currentUser?.responsibleDepartments && currentUser?.responsibleDepartments.length > 0) {
        // Team Leader can see hours from ALL their responsible departments
        console.log('🎯 TEAM LEADER HOURS:', currentUser.responsibleDepartments);
        const userDept = await User.find({ department: { $in: currentUser.responsibleDepartments }, ...testFilter }).select('_id');
        const highboardDept = await HighBoard.find({ department: { $in: currentUser.responsibleDepartments }, ...testFilter }).select('_id');
        const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
        query = { user: { $in: allDeptUsers } };
    }
    // 2. HR Member (Coordinator) Logic
    // HR Coordinators have role='Member' but special title
    else if (currentUser?.department === 'HR' && currentUser?.role === 'Member') {
         // Check title for responsibility
         if (currentUser.title?.startsWith('HR Coordinator')) {
             const coordDept = currentUser.title.split(' - ')[1];
             if (coordDept) {
                 const userDept = await User.find({ department: coordDept, ...testFilter }).select('_id');
                 const highboardDept = await HighBoard.find({ department: coordDept, ...testFilter }).select('_id');
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
    // 3. Regular Members: See ONLY their own hours
    else if (currentUser?.role === 'Member') {
      query = { user: currentUser._id };
    } 
    // 3. Head / Vice Head: See hours for their Department members
    else if (currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') {
      // Check BOTH User and HighBoard collections
      const userDept = await User.find({ department: currentUser.department, ...testFilter }).select('_id');
      const highboardDept = await HighBoard.find({ department: currentUser.department, ...testFilter }).select('_id');
      const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
      query = { user: { $in: allDeptUsers } };
    }
    // 4. Operation Director
    else if (currentUser?.role === 'Operation Director') {
         const userDept = await User.find({ department: { $in: ['PR', 'FR', 'Logistics', 'PM'] }, ...testFilter }).select('_id');
         const highboardDept = await HighBoard.find({ department: { $in: ['PR', 'FR', 'Logistics', 'PM'] }, ...testFilter }).select('_id');
         const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
         query = { user: { $in: allDeptUsers } };
    }
    // 5. Creative Director
    else if (currentUser?.role === 'Creative Director') {
         const userDept = await User.find({ department: { $in: ['Marketing', 'Multi-Media', 'Presentation', 'Organization'] }, ...testFilter }).select('_id');
         const highboardDept = await HighBoard.find({ department: { $in: ['Marketing', 'Multi-Media', 'Presentation', 'Organization'] }, ...testFilter }).select('_id');
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

         const userDept = await User.find({ department: deptName, ...testFilter }).select('_id');
         const highboardDept = await HighBoard.find({ department: deptName, ...testFilter }).select('_id');
         const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
         query = { user: { $in: allDeptUsers } };
      } else {
         // General HR (hr@enactus.com) - Sees All or filters via query
         // Current behavior for General HR: Default All
         const { department } = req.query;
         if (department && department !== 'All') {
            const userDept = await User.find({ department, ...testFilter }).select('_id');
            const highboardDept = await HighBoard.find({ department, ...testFilter }).select('_id');
            const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
            query = { user: { $in: allDeptUsers } };
         }
      }
    }
    // 7. General President / VP: Sees ALL (can filter)
    else if (['General President', 'Vice President'].includes(currentUser?.role)) {
      const { department } = req.query;
      if (department && department !== 'All') {
        const userDept = await User.find({ department, ...testFilter }).select('_id');
        const highboardDept = await HighBoard.find({ department, ...testFilter }).select('_id');
        const allDeptUsers = [...userDept.map(u => u._id), ...highboardDept.map(u => u._id)];
        query = { user: { $in: allDeptUsers } };
      }
    }

    // Fetch logs, populating user details
    const logs = await HourLog.find({ ...query, ...testFilter })
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
    const currentUser = (req as any).user;
    
    // Block Directors from approving (read-only access)
    if (currentUser?.role === 'Operation Director' || currentUser?.role === 'Creative Director') {
      return res.status(403).json({ message: 'Directors have read-only access and cannot approve hours.' });
    }
    
    // Verify Log Existence
    const log = await HourLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    // ISOLATION: Test accounts can only update test hours
    if (currentUser?.isTest !== log.isTest) {
        return res.status(403).json({ message: 'Security Breach: Isolation mismatch.' });
    }

    // 🔒 PERMISSION CHECK
    const targetUserId = log.user;
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: 'User for this log not found' });

    const isGenPresOrVP = ['General President', 'Vice President'].includes(currentUser.role);
    const isHRRole = currentUser.role === 'HR'; // Explicit HR Role
    const isHRMember = currentUser.department === 'HR' && currentUser.role === 'Member';
    const isHRHead = currentUser.department === 'HR' && (currentUser.role === 'Head' || currentUser.role === 'Vice Head'); // HR Head

    // HR Coordinator
    if (isHRMember && currentUser.title?.startsWith('HR Coordinator')) {
        const coordDept = currentUser.title.split(' - ')[1];
        if (targetUser.department !== coordDept && coordDept !== 'HR') { // Allow if coord for HR?
             return res.status(403).json({ message: `You can only approve hours for ${coordDept} department.` });
        }
    }
    // HR Team Leader
    else if (isHRMember && currentUser.position === 'Team Leader' && currentUser.responsibleDepartments) {
        if (!currentUser.responsibleDepartments.includes(targetUser.department)) {
             return res.status(403).json({ message: `You can only approve hours for your responsible departments: ${currentUser.responsibleDepartments.join(', ')}` });
        }
    }
    // Regular Member (Block unless they fell into above)
    else if (currentUser.role === 'Member') {
         return res.status(403).json({ message: 'Members are not authorized to approve hours.' });
    }
    // Heads (non-HR) shouldn't be approving hours? Or maybe they do? 
    // Assuming Heads generally can approve for their dept? 
    // Existing logic didn't restricts Heads. I'll leave them be or check department match?
    // For now, focusing on Member (Team Leader) security.

    // Update status and set who approved it
    const { status } = req.body;
    log.status = status;
    if (status === 'Approved') {
      log.approvedBy = currentUser?._id;
      
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
