import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore DNS set failures if restricted
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not configured');
}

let cached = globalThis.__mongoose;

if (!cached) {
  cached = globalThis.__mongoose = {
    conn: null,
    promise: null,
  };
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongooseInstance) => {
        console.log(
          `[MongoDB] Connected: ${mongooseInstance.connection.host} / ${mongooseInstance.connection.name}`
        );

        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        console.error(`[MongoDB Error] ${error.message}`);
        throw error;
      });
  }

  cached.conn = await cached.promise;

  return cached.conn;
};
