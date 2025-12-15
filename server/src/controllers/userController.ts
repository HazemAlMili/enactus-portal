// Import express types
import { Request, Response } from 'express';
// Import User model and bcrypt for hashing
import User from '../models/User';
import HighBoard from '../models/HighBoard';
import Task from '../models/Task';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/dbConnect';

/**
 * Controller to fetch the leaderboard.
 * Returns users sorted by points in descending order.
 * Route: GET /api/users/leaderboard
 * Access: Private/Public
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  await dbConnect();
  try {
    // Find users, select specific fields to minimize data transfer
    // Filter strictly for Members, as requested
    const users = await User.find({ role: 'Member' })
      .select('name points hoursApproved department role') // Only needed fields
      .sort({ hoursApproved: -1 }) // Sort by hoursApproved descending (highest first)
      .limit(50) // Limit to top 50 users (Optimization)
      .lean(); // ⚡ Plain objects for speed
      
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to get all users.
 * Used for admin/HR management views.
 * Route: GET /api/users
 * Access: Private (HR/Head)
 */
export const getUsers = async (req: Request, res: Response) => {
  await dbConnect();
  try {
    let query: any = {};
    const currentUser = (req as any).user;

    // 1. Head / Vice Head: See only their Department members
    if (currentUser?.role === 'Head' || currentUser?.role === 'Vice Head') {
      query = { department: currentUser.department };
    }
    // 2. Operation Director
    else if (currentUser?.role === 'Operation Director') {
        query = { department: { $in: ['PR', 'FR', 'Logistics', 'PM'] } };
    }
    // 3. Creative Director
    else if (currentUser?.role === 'Creative Director') {
        query = { department: { $in: ['Marketing', 'Multi-Media', 'Presentation', 'Organization'] } };
    }
    // 2. HR Logic
    else if (currentUser?.role === 'HR') {
      const email = currentUser.email || '';
      const hrMatch = email.match(/^hr-(.+)@/); 
      
      if (hrMatch) {
         const targetDept = hrMatch[1].toUpperCase().replace('MULTIMEDIA', 'Multi-Media');
         const validDepts = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
         const deptName = validDepts.find(d => d.replace(/[^a-zA-Z]/g, '').toLowerCase() === targetDept.replace(/[^a-zA-Z]/g, '').toLowerCase()) || targetDept;
         
         query = { department: deptName };
      }
      // General HR sees all (query remains {})
    }
    // 2a. HR Coordinator Logic
    else if (currentUser?.department === 'HR' && currentUser?.role === 'Member' && currentUser?.title?.startsWith('HR Coordinator')) {
        // "HR Coordinator - IT" -> See IT members
        const coordDept = currentUser.title.split(' - ')[1];
        if (coordDept) {
            query = { department: coordDept };
        } else {
             // Fallback: See own/HR? Or nothing?
             // If title is malformed, show HR dept
             query = { department: 'HR' };
        }
    }
    // General President sees all

    let users = await User.find(query).select('-password');
    
    // Custom Sort by Role Hierarchy
    const roleOrder: { [key: string]: number } = {
      'General President': 1,
      'Vice President': 2,
      'Operation Director': 3,
      'Creative Director': 3,
      'Head': 4,
      'Vice Head': 5,
      'HR': 6,
      'Member': 7
    };

    users = users.sort((a, b) => {
      const rankA = roleOrder[a.role as string] || 99;
      const rankB = roleOrder[b.role as string] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to create a new user.
 * Used by HR/Admins to recruit new members.
 * Route: POST /api/users
 * Access: Private (HR/Head)
 */
export const createUser = async (req: Request, res: Response) => {
  await dbConnect();
  try {
    const { name, email, password, role, department, title } = req.body;
    const currentUser = (req as any).user;
    // 1. HR Recruitment Rules
    // HR Head can recruit anyone.
    // HR Dept Members (Coordinators) can recruit ONLY for their assigned department (which should be stored or inferred).
    // The user request says: "Each HR coordinator ... can only add members of the departments them responsibales for"
    
    // For now, let's look at the logic requested: "HR head can only add (Members of HR)"
    // This implies HR Coordinators CANNOT add members to the HR Department.
    
    if (department === 'HR') {
        if (currentUser.role !== 'Head' && currentUser.role !== 'General President' && currentUser.role !== 'Vice President') {
             return res.status(403).json({ message: 'Only the HR Head (or Board) can recruit HR members.' });
        }
        
        // If recruiting a member INTO HR, they are usually an "HR Coordinator".
        // The requester wants a dropdown to "select the department who will responsible for" (Recruiting HR Coordinator for IT, for PM, etc.)
        // We'll store this "Specific Department Responsibility" in the `department` field? No, they belong to HR dept.
        // We need a way to Tag them. Maybe in the `title` or a new field?
        // Let's use the `title` field for now to store "HR Coordinator - IT", etc. OR rely on email conventions (hr-it@...).
        // If the request body has a 'targetDepartment' or we abuse the 'title' field.
        
        // Assuming the Frontend sends `title` like "HR Coordinator for IT"
    } else {
        // Recruiting for other departments (IT, PM, etc.)
        
        // If current user is HR Member (Coordinator), they can only recruit for THEIR target department.
        // But how do we know their target department? 
        // Previously we used regex on email (hr-it@...).
        if (currentUser.role === 'HR' && currentUser.department === 'HR') {
             const email = currentUser.email || '';
             const hrMatch = email.match(/^hr-(.+)@/);
             
             if (hrMatch) {
                 const allowedDeptToken = hrMatch[1].toUpperCase().replace('MULTIMEDIA', 'Multi-Media');
                 // Check if `department` matches `allowedDeptToken` (fuzzy match)
                 // Just simple check
                 const normalize = (s: string) => s.replace(/[^a-zA-Z]/g, '').toLowerCase();
                 
                 if (normalize(department) !== normalize(allowedDeptToken)) {
                     return res.status(403).json({ message: `You are only authorized to recruit for the ${allowedDeptToken} department.` });
                 }
             } else {
                 // General HR User without specific email tag? 
                 // Maybe fallback or deny? 
                 // "Each HR coordinator (we will specify them later) can only add members of the departments them responsibales for"
                 // If we can't determine responsibility, maybe default to allow or deny. 
                 // Let's allow for now if they are "General HR", or strict if required. 
                 // STRICT: If you are HR Member but not Head, and we can't find your tag, you can't recruit.
                 // return res.status(403).json({ message: 'Unable to verify your department responsibility.' });
             }
        }
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: `User with email '${email}' already exists.` });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user in the database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      title
    });

    // AUTO-ASSIGN EXISTING DEPARTMENT TASKS TO NEW MEMBER
    if (department && (role === 'Member' || role === 'HR')) {
       // Find all tasks in this department (exclude rejected/archived if you want, but likely better to include active 'Pending' or 'Submitted' templates)
       // We only want the *Templates* essentially. Any task assigned to someone else in this dept represents a mission.
       const deptTasks = await Task.find({ department });

       // Deduplicate by Title + Description to identify unique "Missions"
       const uniqueMissions = new Map();
       deptTasks.forEach(t => {
          const key = `${t.title}-${t.description}`;
          if (!uniqueMissions.has(key)) {
             uniqueMissions.set(key, t);
          }
       });

       // Create a task instance for the new user for each unique mission
       if (uniqueMissions.size > 0) {
          const tasksToCreate = Array.from(uniqueMissions.values()).map(template => ({
             title: template.title,
             description: template.description,
             assignedTo: user._id, // Assign to NEW user
             assignedBy: template.assignedBy,
             department: template.department,
             scoreValue: template.scoreValue,
             resourcesLink: template.resourcesLink,
             status: 'Pending' // Start as Pending
          }));

          await Task.insertMany(tasksToCreate);
       }
    }

    // Return the new user information (excluding sensitive data implicitely via construction, though manually selecting fields is safer)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * Controller to delete a user.
 * Route: DELETE /api/users/:id
 * Access: Private (Admin/HR)
 */
export const deleteUser = async (req: Request, res: Response) => {
  await dbConnect();
  try {
    const userToDelete = await User.findById(req.params.id);
    const currentUser = (req as any).user;

    if (!userToDelete) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Default: Check Admin/HR Permissions
    const isAdmin = ['General President', 'Vice President', 'Head'].includes(currentUser.role) || currentUser.department === 'HR';
    
    // HR Coordinator Check
    const isHRCoordinator = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator');
    let hasPermission = isAdmin;

    if (isHRCoordinator) {
        // Parse "HR Coordinator - DEPT"
        const parts = currentUser.title ? currentUser.title.split(' - ') : [];
        const coordDept = parts.length > 1 ? parts[1].trim() : null;
        
        if (coordDept && userToDelete.department === coordDept) {
             hasPermission = true;
        } else {
             // Explicitly deny if they are coordinate but dept doesn't match
             // even if isAdmin was true (because they have 'HR' dept), we restrict them here.
             hasPermission = false;
        }
    }

    // Head Check (Can delete own members?) - Assuming Heads can delete their members as requested implicitly by "everything like Head"
    if (currentUser.role === 'Head' && userToDelete.department === currentUser.department) {
        hasPermission = true;
    }

    if (hasPermission) {
      await userToDelete.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(403).json({ message: 'Not authorized to delete this user' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  await dbConnect();
  try {
    const { avatar } = req.body;
    // @ts-ignore
    const userId = req.user.id; 

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar data is required' });
    }

    let user = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true, select: '-password' }
    );

    if (!user) {
       user = await HighBoard.findByIdAndUpdate(
        userId,
        { avatar },
        { new: true, select: '-password' }
      );
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Server error updating avatar' });
  }
};

/**
 * Controller to issue a warning to a user.
 * Route: POST /api/users/:id/warning
 * Access: HR Only
 */
export const addWarning = async (req: Request, res: Response) => {
  await dbConnect();
  try {
     const targetUserId = req.params.id;
     const { reason } = req.body;
     const currentUser = (req as any).user;

     // Check if HR Coordinator
     const isHRCoordinator = currentUser.role === 'Member' && currentUser.department === 'HR' && currentUser.title?.startsWith('HR Coordinator');
     
     if (currentUser.role !== 'HR' && currentUser.role !== 'Head' && currentUser.department !== 'HR' && currentUser.role !== 'General President' && !isHRCoordinator) {
         return res.status(403).json({ message: 'Only HR can issue warnings.' });
     }

     const targetUser = await User.findById(targetUserId);
     if (!targetUser) return res.status(404).json({ message: 'User not found' });
     
     if (targetUser.role !== 'Member') {
        return res.status(400).json({ message: 'Warnings can only be issued to Members.' });
     }

     // HR Coordinator Logic: Can only warn members of THEIR specific department
     if (isHRCoordinator) {
         const coordDept = currentUser.title.split(' - ')[1];
         if (coordDept && targetUser.department !== coordDept) {
             return res.status(403).json({ message: `You are authorized to warn members of the ${coordDept} department only.` });
         }
     }

     targetUser.warnings = targetUser.warnings || [];
     targetUser.warnings.push({
         reason: reason || 'Violation of conduct',
         date: new Date(),
         issuer: currentUser.name
     });

     await targetUser.save();
     res.json({ message: 'Warning issued successfully.', warnings: targetUser.warnings });

  } catch (error) {
     console.error(error);
     res.status(500).json({ message: 'Server Error' });
  }
};
