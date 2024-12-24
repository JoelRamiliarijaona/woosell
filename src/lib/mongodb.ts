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
  // Skip la connexion pendant le build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return;
  }
  
  try {
    await mongoose.connect(uri, options);
    console.log('Mongoose connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB with Mongoose:', error);
  }
}

// Démarrer la connexion seulement si ce n'est pas un build
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  connectWithMongoose();
}

// En mode développement, réutiliser la connexion entre les rechargements
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
  // Skip la connexion pendant le build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return {} as Db;
  }
  
  try {
    const client = await clientPromise;
    return client.db();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

export default clientPromise;
