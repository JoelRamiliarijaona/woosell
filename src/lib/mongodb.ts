import mongoose from 'mongoose';
import { Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

type GlobalMongooseType = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: GlobalMongooseType;
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

export type DbConnection = {
  conn: typeof mongoose;
  db: Db;
};

export async function connectToDatabase(): Promise<DbConnection> {
  try {
    if (global.mongoose.conn) {
      const db = global.mongoose.conn.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }
      return {
        conn: global.mongoose.conn,
        db
      };
    }

    if (!global.mongoose.promise) {
      global.mongoose.promise = mongoose.connect(MONGODB_URI!, {
        bufferCommands: false,
      });
    }

    const conn = await global.mongoose.promise;
    global.mongoose.conn = conn;

    const db = conn.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    return {
      conn,
      db
    };
  } catch (e) {
    global.mongoose.promise = null;
    throw e;
  }
}
