import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';

// Valeur par défaut pour le build
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/woosell';

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Configure mongoose
mongoose.set('strictQuery', true);

// Fonction pour se connecter à MongoDB avec mongoose
async function connectWithMongoose() {
  try {
    if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
      throw new Error('Please add your Mongo URI to environment variables');
    }
    
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Mongoose connected successfully');
    
    // Écouter les événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected, attempting to reconnect...');
      connectWithMongoose();
    });

  } catch (err) {
    console.error('Error connecting to MongoDB with Mongoose:', err);
    // Réessayer après 5 secondes
    setTimeout(connectWithMongoose, 5000);
  }
}

// Démarrer la connexion
connectWithMongoose();

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getMongoDb(): Promise<Db> {
  try {
    const client = await clientPromise;
    const db = client.db();
    console.log('Successfully connected to MongoDB database');
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Export a module-scoped MongoClient promise
export default clientPromise;
