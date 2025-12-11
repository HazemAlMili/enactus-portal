// Import express types
import { Request, Response } from 'express';
// Import User model and bcrypt for hashing
import User from '../models/User';
import bcrypt from 'bcryptjs';

/**
 * Controller to fetch the leaderboard.
 * Returns users sorted by points in descending order.
 * Route: GET /api/users/leaderboard
 * Access: Private/Public
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    // Find users, select specific fields to minimize data transfer
    const users = await User.find({})
      .select('name points department role') // Only needed fields
      .sort({ points: -1 }) // Sort by points descending (highest first)
      .limit(50); // Limit to top 50 users (Optimization)
      
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
  try {
    // Return all users excluding the password field for security
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
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
  try {
    const { name, email, password, role, department } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
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
      department
    });

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
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
