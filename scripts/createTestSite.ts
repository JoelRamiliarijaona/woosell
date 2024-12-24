import { getMongoDb } from '../src/lib/mongodb';
import User from '../src/models/User';
import { model, models } from 'mongoose';
import { ISite } from '../src/models/Site';

// Récupérer ou créer le modèle Site
const Site = models.Site || model<ISite>('Site');

async function createTestSite() {
  try {
    // Connexion à la base de données
    const db = await getMongoDb();
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

    process.exit(0);
  } catch (error) {
    console.error('Error creating test site:', error);
    process.exit(1);
  }
}

createTestSite();
