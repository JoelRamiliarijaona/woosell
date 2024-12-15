import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { Types } from 'mongoose';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    console.log('Session dans /api/sites:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.id) {
      console.error('Pas d\'ID utilisateur dans la session');
      return NextResponse.json({ error: 'Non autorisé - ID manquant' }, { status: 401 });
    }

    // Connexion à la base de données
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Connexion à la base de données échouée');
      throw new Error('La connexion à la base de données a échoué');
    }

    // Récupérer l'utilisateur à partir de son sub Keycloak
    const keycloakId = session.user.id;
    console.log('Recherche utilisateur avec keycloakId:', keycloakId);

    const user = await db.collection('users').findOne({ keycloakId });
    console.log('Utilisateur trouvé:', user);

    if (!user) {
      // Si l'utilisateur n'existe pas, on le crée
      console.log('Création d\'un nouvel utilisateur');
      const newUser = {
        keycloakId,
        email: session.user.email,
        name: session.user.name,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('users').insertOne(newUser);
      console.log('Nouvel utilisateur créé:', result);

      // Utiliser le nouvel utilisateur
      const sites = await db.collection('sites')
        .find({ userId: new Types.ObjectId(result.insertedId) })
        .toArray();

      return NextResponse.json(sites);
    }

    // Récupérer tous les sites de l'utilisateur
    const sites = await db.collection('sites')
      .find({ userId: new Types.ObjectId(user._id) })
      .toArray();

    console.log('Sites trouvés:', sites);

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Erreur lors de la récupération des sites:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sites', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Connexion à la base de données
    const { db } = await connectToDatabase();
    if (!db) {
      throw new Error('La connexion à la base de données a échoué');
    }

    // Récupérer l'utilisateur
    const keycloakId = session.user.id;
    console.log('Recherche utilisateur avec keycloakId:', keycloakId);

    const user = await db.collection('users').findOne({ keycloakId });
    console.log('Utilisateur trouvé:', user);

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les données du site
    const body = await request.json();
    const { name, domain, wooCommerceDetails } = body;

    // Créer le site dans la base de données
    const site = {
      userId: new Types.ObjectId(user._id),
      name,
      domain,
      status: 'active',
      orderCount: 0,
      totalRevenue: 0,
      wooCommerceDetails,
      settings: {
        automaticProductImport: true,
        notificationEmail: session.user.email,
        orderNotifications: true
      },
      webhooks: {
        orders: {
          id: wooCommerceDetails.webhook_id,
          topic: 'order.completed',
          deliveryUrl: `${process.env.NEXTAUTH_URL}/api/woocommerce/webhook`
        }
      },
      lastSync: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('sites').insertOne(site);
    console.log('Site created:', result);

    return NextResponse.json({
      message: 'Site créé avec succès',
      site: { ...site, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Erreur lors de la création du site:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du site', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
