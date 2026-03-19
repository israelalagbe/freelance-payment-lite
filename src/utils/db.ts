import mongoose from 'mongoose';
import config from '../config';

export async function connectDB(uri?: string): Promise<void> {
  await mongoose.connect(uri ?? config.mongoUri);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
