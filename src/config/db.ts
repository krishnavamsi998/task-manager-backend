import mongoose from 'mongoose';

export const connectDB = async (uri?: string): Promise<void> => {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/task-tracker';
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};