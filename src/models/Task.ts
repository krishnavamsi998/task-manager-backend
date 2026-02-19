import mongoose, { Document, Schema } from 'mongoose';

export type TaskStatus = 'pending' | 'completed';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: Date;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
  },
  { timestamps: true }
);

// Indexes for performance
taskSchema.index({ owner: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, createdAt: -1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);