// Import mongoose and specific types for schema definition and typing
import mongoose, { Schema, Document } from 'mongoose';

// Define the Interface for the User document to ensure type safety in the application
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'General President' | 'Vice President' | 'Operation Director' | 'Creative Director' | 'HR' | 'Head' | 'Vice Head' | 'Member';
  title?: string; // Custom title like 'Vice President', 'Creative Director'
  department?: 'General' | 'IT' | 'HR' | 'PM' | 'PR' | 'FR' | 'Logistics' | 'Organization' | 'Marketing' | 'Multi-Media' | 'Presentation'; // Enum for departments
  team?: string; // Sub-team within department (e.g., 'Frontend', 'UI/UX' for IT)
  hoursApproved: number; // Tracking approved volunteer hours
  tasksCompleted: number; // Tracking number of tasks completed
  points: number; // Gamification points
  position?: 'Member' | 'Team Leader'; // Local position within department
  avatar?: string; // URL or Base64 string of user avatar
  warnings?: { reason: string; date: Date; issuer: string }[];
  isTest?: boolean; // Portfolio demo mode flag
}

// Create the Mongoose Schema corresponding to the IUser interface
const UserSchema: Schema = new Schema({
  name: { type: String, required: true }, // User's full name, required
  email: { type: String, required: true, unique: true }, // User's email, must be unique across the database
  password: { type: String, required: true }, // Hashed password
  role: { 
    type: String, 
    enum: ['General President', 'Vice President', 'Operation Director', 'Creative Director', 'HR', 'Head', 'Vice Head', 'Member'], 
    default: 'Member' 
  },
  title: { type: String },
  department: { 
    type: String, 
    enum: ['General', 'IT', 'HR', 'PM', 'PR', 'FR', 'Logistics', 'Organization', 'Marketing', 'Multi-Media', 'Presentation'] // Restrict values to specific departments
  },
  team: { type: String, index: true }, // Sub-team within department
  hoursApproved: { type: Number, default: 0 }, // Initialize hours to 0
  tasksCompleted: { type: Number, default: 0 }, // Initialize tasks completed to 0
  points: { type: Number, default: 0 }, // Initialize points to 0
  position: { 
    type: String, 
    enum: ['Member', 'Team Leader'], 
    default: 'Member' 
  },
  avatar: { type: String }, // Profile picture (Base64 or URL)
  warnings: [{
    reason: { type: String },
    date: { type: Date, default: Date.now },
    issuer: { type: String }
  }],
  isTest: { type: Boolean, default: false }, // Shadow test account
}, { timestamps: true }); // Automatically add createdAt and updatedAt fields

// ⚡ PERFORMANCE INDEXES - Critical for query speed
UserSchema.index({ department: 1, role: 1 }); // For filtered department queries
UserSchema.index({ department: 1, team: 1, role: 1 }); // For team-based filtering
UserSchema.index({ role: 1 }); // For role-based filtering
UserSchema.index({ hoursApproved: -1 }); // For leaderboard sorting (DESC)
UserSchema.index({ email: 1 }); // Ensure email index for login (should be unique)
UserSchema.index({ points: -1 }); // For points-based rankings
UserSchema.index({ isTest: 1, role: 1 }); // For test/real user isolation queries
// ⚡ COMPOUND INDEX for LEADERBOARD - Eliminates 6s latency!
UserSchema.index({ role: 1, isTest: 1, hoursApproved: -1 }); // Perfect for leaderboard query

// Export the Mongoose model based on the schema and interface
export default mongoose.model<IUser>('User', UserSchema);
