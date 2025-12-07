import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId; // User
  assignedBy: mongoose.Types.ObjectId; // Head
  status: 'Pending' | 'Submitted' | 'Completed';
  scoreValue: number;
  dueDate?: Date;
  submissionLink?: string;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Submitted', 'Completed'],
    default: 'Pending'
  },
  scoreValue: { type: Number, default: 10 },
  dueDate: { type: Date },
  submissionLink: { type: String }
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
