import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'General President' | 'HR' | 'Head' | 'Vice Head' | 'Member';
  department?: 'IT' | 'HR' | 'PM' | 'PR' | 'FR' | 'Logistics' | 'Organization' | 'Marketing' | 'Multi-Media' | 'Presentation';
  hoursApproved: number;
  tasksCompleted: number;
  points: number;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['General President', 'HR', 'Head', 'Vice Head', 'Member'],
    default: 'Member'
  },
  department: { 
    type: String, 
    enum: ['IT', 'HR', 'PM', 'PR', 'FR', 'Logistics', 'Organization', 'Marketing', 'Multi-Media', 'Presentation']
  },
  hoursApproved: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
