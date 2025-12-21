// Import mongoose types
import mongoose, { Schema, Document } from 'mongoose';

// Define Interface for HourLog document
export interface IHourLog extends Document {
  user: mongoose.Types.ObjectId; // Reference to the user submitting
  amount: number; // Number of hours
  description: string; // Description of activity
  status: 'Pending' | 'Approved' | 'Rejected';
  date: Date;
  approvedBy?: mongoose.Types.ObjectId; // Reference to who approved it
  isTest?: boolean;
}

// Create Schema
const HourLogSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  date: { type: Date, default: Date.now },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isTest: { type: Boolean, default: false }
}, { timestamps: true });

// ⚡ PERFORMANCE INDEXES - For hour tracking queries
HourLogSchema.index({ user: 1, status: 1 }); // User's hours by status
HourLogSchema.index({ status: 1, createdAt: -1 }); // Pending queue sorted by date
HourLogSchema.index({ createdAt: -1 }); // Recent logs

// Export Model
export default mongoose.model<IHourLog>('HourLog', HourLogSchema);
