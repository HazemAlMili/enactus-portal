import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/enactus_portal';

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env');
}

/**
 * MongoDB Singleton Pattern with Optimizations for Remote Databases (Bahrain)
 * 
 * This ensures ONE connection is reused across all requests, avoiding:
 * - Connection handshake delay (~5-10s to Bahrain!)
 * - Multiple simultaneous connections
 * - Connection exhaustion
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global to persist connection across hot-reloads in development
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with singleton pattern
 * Reuses existing connection if available
 */
async function dbConnect(): Promise<typeof mongoose> {
  // Return existing connection immediately
  if (cached.conn) {
    // Verify connection is still alive
    if (cached.conn.connection.readyState === 1) {
      return cached.conn;
    } else {
      // Connection died, reset cache
      console.log('⚠️ MongoDB connection lost, reconnecting...');
      cached.conn = null;
      cached.promise = null;
    }
  }

  // Check if mongoose is already connected (from tests or previous runs)
  if (mongoose.connections.length > 0 && mongoose.connections[0].readyState === 1) {
    cached.conn = mongoose;
    console.log('✅ Using existing Mongoose connection');
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    const startTime = Date.now();
    console.log('🔌 Initiating MongoDB connection to Bahrain...');
    
    const opts = {
      bufferCommands: false,
      maxPoolSize: 15,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[],
    };

    cached.promise = mongoose.connect(MONGO_URI, opts)
      .then((mongoose) => {
        const duration = Date.now() - startTime;
        console.log(`✅ MongoDB connected successfully in ${duration}ms`);
        console.log(`📡 Connection pool: ${opts.minPoolSize}-${opts.maxPoolSize} connections`);
        
        // Set up connection event listeners
        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
          console.log('⚠️ MongoDB disconnected');
          cached.conn = null;
          cached.promise = null;
        });
        
        mongoose.connection.on('reconnected', () => {
          console.log('✅ MongoDB reconnected');
        });
        
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
        cached.promise = null; // Reset so next request can retry
        throw error;
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

/**
 * Gracefully close MongoDB connection
 * Call this on server shutdown
 */
export async function dbDisconnect(): Promise<void> {
  if (cached.conn) {
    await cached.conn.connection.close();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 MongoDB connection closed');
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus(): {
  isConnected: boolean;
  readyState: number;
  name: string;
} {
  const conn = cached.conn?.connection;
  return {
    isConnected: conn?.readyState === 1,
    readyState: conn?.readyState || 0,
    name: conn?.name || 'unknown'
  };
}

export default dbConnect;
