// Import Express types
import { Request, Response, NextFunction } from 'express';
// Import jsonwebtoken for token verification
import jwt from 'jsonwebtoken';
// Import User model
import User from '../models/User';

// Define Interface for Decoded JWT Token
interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to protect routes.
 * Verifies the JWT token from the Authorization header.
 * Attaches the user object to the request if valid.
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check for Authorization header starting with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from header ('Bearer <token>')
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as DecodedToken;
      console.log('Decoded Token:', decoded);

      // Find user associated with token ID, excluding password field
      const user = await User.findById(decoded.id).select('-password');
      console.log('User found in DB:', user);
      
      // Attach user to request object (using @ts-ignore to bypass Express type definition extension issue)
      // @ts-ignore
      req.user = user || undefined;
      
      // Proceed to next middleware/controller
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // Check if token was found
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Middleware to restrict access based on user roles.
 * @param roles - List of allowed roles (e.g. 'Head', 'HR')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user is logged in (from protect middleware) and has allowed role
    // @ts-ignore
    if (!req.user || !roles.includes(req.user.role)) {
      // @ts-ignore
      return res.status(403).json({ message: `User role ${req.user?.role} is not authorized to access this route` });
    }
    next();
  };
};
