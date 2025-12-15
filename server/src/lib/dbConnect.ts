import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/enactus_portal';

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  // Check if there is an existing active connection (e.g. from Tests)
  if (mongoose.connections.length > 0 && mongoose.connections[0].readyState === 1) {
      cached.conn = mongoose;
      return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // ⚡ PERFORMANCE: Connection pooling for concurrent requests
      maxPoolSize: 10, // Increased from default 5
      minPoolSize: 2,  // Keep 2 connections always ready
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      console.log('MongoDB Connected via dbConnect');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
