import mongoose, { Schema, Document } from 'mongoose';

export interface IHourLog extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: Date;
  approvedBy?: mongoose.Types.ObjectId;
}

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

export default mongoose.model<IHourLog>('HourLog', HourLogSchema);
