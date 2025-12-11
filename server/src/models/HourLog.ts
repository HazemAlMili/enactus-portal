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
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Export Model
export default mongoose.model<IHourLog>('HourLog', HourLogSchema);
