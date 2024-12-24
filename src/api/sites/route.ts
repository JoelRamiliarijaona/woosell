import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { WooCommerceClient } from '@/lib/woocommerce';
import { Site } from '@/types';
import { ObjectId, OptionalId } from 'mongodb';

interface CreateSiteRequest {
  domain: string;
  name: string;
  password: string;
  productType: 'physical' | 'digital' | 'subscription';
}

interface WooCommerceCredentials {
  consumerKey: string;
  consumerSecret: string;
  siteUrl: string;
}

interface CreateSiteResponse {
  message: string;
  siteId: ObjectId;
  credentials: WooCommerceCredentials;
}

// GET /api/sites - Récupérer la liste des sites
export async function GET(request: Request) {
  try {
    // En mode développement, on ne vérifie pas l'authentification
    let userId = 'dev-user';
    if (process.env.NODE_ENV === 'production') {
      const user = await verifyToken(request);
      if (!user) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        );
      }
      userId = user.sub || 'unknown';
    }

    const db = await getMongoDb();
    
    console.log('Fetching sites for userId:', userId);
    
    const sites = await db.collection<Site>('sites')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('Found sites:', sites.length);

    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      },
      { status: 500 }
    );
  }
}

// POST /api/sites - Créer un nouveau site
export async function POST(request: Request) {
  try {
    // En mode développement, on ne vérifie pas l'authentification
    let userId = 'dev-user';
    if (process.env.NODE_ENV === 'production') {
      const user = await verifyToken(request);
      if (!user) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        );
      }
      userId = user.sub || 'unknown';
    }

    const body = await request.json();
    const { domain, name, password, productType } = body as CreateSiteRequest;

    if (!domain || !name || !password || !productType) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    // Vérifier si le domaine existe déjà
    const existingSite = await db.collection<Site>('sites').findOne({ domain });
    if (existingSite) {
      return NextResponse.json(
        { error: 'Ce domaine est déjà utilisé' },
        { status: 400 }
      );
    }

    // Créer le site WooCommerce
    const woocommerce = new WooCommerceClient(
      process.env.WC_CONSUMER_KEY || '',
      process.env.WC_CONSUMER_SECRET || '',
      process.env.WC_API_URL || ''
    );

    const wooSiteResult = await woocommerce.createWooCommerceSite({
      domain,
      name,
      password,
      userId
    });

    console.log('WooCommerce site creation result:', wooSiteResult);

    if (!wooSiteResult.success || !wooSiteResult.data) {
      console.error('WooCommerce site creation failed:', wooSiteResult.error);
      return NextResponse.json(
        { error: wooSiteResult.error?.message || 'Échec de la création du site WooCommerce' },
        { status: 400 }
      );
    }

    // Créer le nouveau site
    const newSite: OptionalId<Site> = {
      id: new ObjectId().toHexString(),
      userId,
      domain,
      name,
      productType,
      status: 'pending',
      totalRevenue: 0,
      settings: {
        woocommerce: {
          consumerKey: wooSiteResult.data.consumerKey,
          consumerSecret: wooSiteResult.data.consumerSecret,
          siteUrl: wooSiteResult.data.storeId,
        }
      },
      lastSync: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection<Site>('sites').insertOne(newSite);

    const response: CreateSiteResponse = {
      message: 'Site créé avec succès',
      siteId: result.insertedId,
      credentials: {
        consumerKey: wooSiteResult.data.consumerKey,
        consumerSecret: wooSiteResult.data.consumerSecret,
        siteUrl: wooSiteResult.data.storeId,
      }
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating site:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      },
      { status: 500 }
    );
  }
}
