// Import mongoose and specific types for schema definition and typing
import mongoose, { Schema, Document } from 'mongoose';

// Define the Interface for the User document to ensure type safety in the application
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'General President' | 'HR' | 'Head' | 'Vice Head' | 'Member'; // Enum for user roles
  department?: 'IT' | 'HR' | 'PM' | 'PR' | 'FR' | 'Logistics' | 'Organization' | 'Marketing' | 'Multi-Media' | 'Presentation'; // Enum for departments
  hoursApproved: number; // Tracking approved volunteer hours
  tasksCompleted: number; // Tracking number of tasks completed
  points: number; // Gamification points
}

// Create the Mongoose Schema corresponding to the IUser interface
const UserSchema: Schema = new Schema({
  name: { type: String, required: true }, // User's full name, required
  email: { type: String, required: true, unique: true }, // User's email, must be unique across the database
  password: { type: String, required: true }, // Hashed password
  role: { 
    type: String, 
    enum: ['General President', 'HR', 'Head', 'Vice Head', 'Member'], // Restrict values to specific roles
    default: 'Member' // Default role is Member
  },
  department: { 
    type: String, 
    enum: ['IT', 'HR', 'PM', 'PR', 'FR', 'Logistics', 'Organization', 'Marketing', 'Multi-Media', 'Presentation'] // Restrict values to specific departments
  },
  hoursApproved: { type: Number, default: 0 }, // Initialize hours to 0
  tasksCompleted: { type: Number, default: 0 }, // Initialize tasks completed to 0
  points: { type: Number, default: 0 }, // Initialize points to 0
}, { timestamps: true }); // Automatically add createdAt and updatedAt fields

// Export the Mongoose model based on the schema and interface
export default mongoose.model<IUser>('User', UserSchema);
