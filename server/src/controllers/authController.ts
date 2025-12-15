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
    // Destructure email and password from the request body
    const { email, password } = req.body;

    // DEBUG: Log incoming request
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Login attempt:', { email, passwordLength: password?.length, bodyKeys: Object.keys(req.body) });
    }

    // Validate that email and password are strings (not objects after sanitization)
    if (typeof email !== 'string' || typeof password !== 'string') {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Validation failed:', { emailType: typeof email, passwordType: typeof password });
      }
      return res.status(400).json({ message: 'Invalid email or password format' });
    }

    // Check if a user with the provided email exists in the database
    // Default to User model (Members)
    let user: any = await User.findOne({ email });

    // If not found in User, check HighBoard (Heads, Board)
    if (!user) {
      user = await HighBoard.findOne({ email });
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
  // Find the user by ID
  // Try User first
  let user: any = await User.findById((req as any).user?._id);

  // If not found, try HighBoard
  if (!user) {
    user = await HighBoard.findById((req as any).user?._id);
  }
  
  if (user) {
    // --- SELF HEALING SYNC LOGIC ---
    // Recalculate stats based on actual Task records to ensure accuracy
    const completedTasks = await Task.find({ 
        assignedTo: user._id, 
        status: 'Completed' 
    });

    const realCount = completedTasks.length;
    const realPoints = completedTasks.reduce((sum, task) => sum + (task.scoreValue || 50), 0);
    
    // Update if different (or just always update to be safe and simple)
    if (user.tasksCompleted !== realCount || user.points !== realPoints) {
        user.tasksCompleted = realCount;
        user.points = realPoints;
        await user.save();
    }
    // -------------------------------

    // Respond with the user's profile information
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      points: user.points,
      hoursApproved: user.hoursApproved,
      tasksCompleted: user.tasksCompleted,
      title: user.title // Include Title
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
