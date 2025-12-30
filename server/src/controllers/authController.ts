// Import express types for request and response handling
import { Request, Response } from 'express';
// Import User model for database operations involving users
import User from '../models/User';
import HighBoard from '../models/HighBoard';
// Import jsonwebtoken to handle JWT generation and verification
import jwt from 'jsonwebtoken';
// Import bcryptjs for secure password hashing and comparison
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/dbConnect';

// Helper function to generate a JSON Web Token (JWT) for a user
const generateToken = (id: string) => {
  // Create a token containing the user's ID, signed with the secret key
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d', // Set the token to expire in 30 days
  });
};

/**
 * Controller to authenticate a user and return a token.
 * Route: POST /api/auth/login
 * Access: Public
 */
export const loginUser = async (req: Request, res: Response) => {
  await dbConnect();
  try {
    // Destructure email and password from the validated body
    // ✅ VALIDATED via loginSchema (Unified rules)
    const { email, password } = (req as any).validatedBody;

    // DEBUG: Log incoming request
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Login attempt:', { email, passwordLength: password?.length });
    }

    // Check if a user with the provided email exists in the database
    // Default to User model (Members)
    let user: any = await User.findOne({ email }).lean();

    // If not found in User, check HighBoard (Heads, Board)
    if (!user) {
      user = await HighBoard.findOne({ email }).lean();
    }

    // Validate the user exists, has a password, and the provided password matches the hashed password
    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      // If valid, respond with the user's data and a new authentication token
      res.json({
        _id: user._id,          // User ID
        name: user.name,        // User Name
        email: user.email,      // User Email
        role: user.role,        // User Role (e.g., Member, Head)
        department: user.department, // User Department
        points: user.points,
        hoursApproved: user.hoursApproved,
        tasksCompleted: user.tasksCompleted,
        title: user.title, // Include Title (Important for HR Coordinators)
        warnings: user.warnings || [], // Include warnings
        isTest: user.isTest || false,
        token: generateToken(user._id.toString()), // Generated JWT Token
      });
    } else {
      // If validation fails, return a 401 Unauthorized status with an error message
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    // Log any errors that occur during the login process to the console
    console.error('Login Error:', error);
    // Return a 500 Server Error status if an exception happens
    res.status(500).json({ message: 'Server error during login', error: error instanceof Error ? error.message : String(error) });
  }
};

// Import Task model for stats synchronization
import Task from '../models/Task';

/**
 * Controller to get the current authenticated user's profile.
 * Route: GET /api/auth/me
 * Access: Private (Requires Auth Middleware)
 * MODIFIED: Performs strict synchronization of stats from Task history.
 */
export const getMe = async (req: Request, res: Response) => {
  await dbConnect();
  // Find the user by ID with select() to only fetch needed fields
  // Try User first
  let user: any = await User.findById((req as any).user?._id).select('-password').lean();

  // If not found, try HighBoard
  if (!user) {
    user = await HighBoard.findById((req as any).user?._id).select('-password').lean();
  }
  
  if (user) {
    // Return cached user data - stats are updated when tasks are completed/approved
    // This avoids expensive Task.find() queries on every page load

    // Respond with the user's profile information
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      points: user.points || 0,
      hoursApproved: user.hoursApproved || 0,
      tasksCompleted: user.tasksCompleted || 0,
      title: user.title, // Include Title
      warnings: user.warnings || [], // Include warnings
      isTest: user.isTest || false,
      avatar: user.avatar // Include avatar
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

/**
 * Controller to change user password
 * Route: POST /api/auth/change-password
 * Access: Private (Requires Auth Middleware)
 */
export const changePassword = async (req: Request, res: Response) => {
  await dbConnect();
  
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?._id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Find user in User model first
    let user: any = await User.findById(userId);
    let isHighBoard = false;

    // If not found in User, check HighBoard
    if (!user) {
      user = await HighBoard.findById(userId);
      isHighBoard = true;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log(`✅ Password changed successfully for user: ${user.name} (${user.email})`);

    res.json({ 
      message: 'Password changed successfully',
      success: true 
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      message: 'Server error during password change', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
