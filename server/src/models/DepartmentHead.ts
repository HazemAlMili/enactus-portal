
import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartmentHead extends Document {
  user: mongoose.Schema.Types.ObjectId;
  department: string;
  role: string;
}

const DepartmentHeadSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One user per head entry
  },
  department: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IDepartmentHead>('DepartmentHead', DepartmentHeadSchema);
