// Import mongoose and Schema types
import mongoose, { Schema, Document } from 'mongoose';

// Define the Interface for the Task document
export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId; // User ID of the assignee
  assignedBy: mongoose.Types.ObjectId; // User ID of the assigner (e.g., Head)
  status: 'Pending' | 'Submitted' | 'Completed'; // Current status of the task
  scoreValue: number; // Points awarded for completing the task
  dueDate?: Date; // Optional deadline
  resourcesLink?: string; // Link provided by assigner
  submissionLink?: string; // Link provided by the assignee upon submission
}

// Create the Mongoose Schema for Tasks
const TaskSchema: Schema = new Schema({
  title: { type: String, required: true }, // Task title
  description: { type: String, required: true }, // Detailed task description
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model (Assignee)
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model (Assigner)
  status: { 
    type: String, 
    enum: ['Pending', 'Submitted', 'Completed'], // Allowed status values
    default: 'Pending' // Default status is Pending
  },
  scoreValue: { type: Number, default: 10 }, // Default points value is 10
  dueDate: { type: Date }, // Due date is optional
  resourcesLink: { type: String }, // Link provided by the assigner (Head)
  submissionLink: { type: String } // Submission link (filled when status becomes Submitted)
}, { timestamps: true }); // Automatically manage createdAt and updatedAt timestamps

// Export the Task model
export default mongoose.model<ITask>('Task', TaskSchema);
