import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(): Promise<void> {
  try {
    // Attempt connecting to the configured MONGODB_URI with fast 500ms check
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 500,
    });
    console.info('✅ Connected to MongoDB server');
  } catch (_err) {
    if (env.NODE_ENV !== 'production') {
      console.warn('⚠️  Could not connect to external MongoDB server.');
      console.info('⚡ Starting automatic in-memory MongoDB server for local development...');

      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();

        await mongoose.connect(uri);
        console.info(`✅ Connected to in-memory MongoDB server (${uri})`);
        return;
      } catch (memErr) {
        console.error('❌ Failed to start in-memory MongoDB server:', memErr);
        process.exit(1);
      }
    } else {
      console.error('❌ MongoDB connection failed:', _err);
      process.exit(1);
    }
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.info('✅ MongoDB reconnected');
});
