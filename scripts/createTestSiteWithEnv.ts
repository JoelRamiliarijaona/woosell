import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectToDatabase } from '../src/lib/mongodb';
import User from '../src/models/User';
import mongoose from 'mongoose';
import { ISite } from '../src/models/Site';

// Définir le schéma du site
const siteSchema = new mongoose.Schema<ISite>({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  domain: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true 
  },
  productType: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['creating', 'active', 'suspended', 'deleted'],
    default: 'creating'
  },
  orderCount: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  wooCommerceDetails: {
    adminUrl: String,
    consumerKey: String,
    consumerSecret: String,
    webhookId: String
  },
  settings: {
    automaticProductImport: {
      type: Boolean,
      default: true
    },
    notificationEmail: String,
    orderNotifications: {
      type: Boolean,
      default: true
    }
  },
  lastSync: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Créer le modèle Site
const Site = mongoose.models.Site || mongoose.model<ISite>('Site', siteSchema);

async function createTestSite() {
  try {
    // Connexion à la base de données
    const { db } = await connectToDatabase();
    if (!db) {
      throw new Error('Failed to connect to database');
    }

    // Récupérer le premier utilisateur
    const user = await User.findOne({});
    if (!user) {
      throw new Error('No user found in the database');
    }

    console.log('Found user:', user);

    // Créer un nouveau site
    const newSite = new Site({
      userId: user._id,
      domain: 'testsite.woosells.com',
      name: 'Test Site',
      productType: 'dropshipping',
      status: 'active',
      orderCount: 0,
      totalRevenue: 0,
      wooCommerceDetails: {
        adminUrl: 'https://testsite.woosells.com/wp-admin',
        consumerKey: 'ck_test123',
        consumerSecret: 'cs_test123',
        webhookId: 'whk_test123'
      },
      settings: {
        automaticProductImport: true,
        notificationEmail: user.email || 'test@example.com',
        orderNotifications: true
      },
      lastSync: new Date()
    });

    // Sauvegarder le site
    await newSite.save();
    console.log('Site created successfully:', newSite);

    // Fermer la connexion à la base de données
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating test site:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTestSite();
