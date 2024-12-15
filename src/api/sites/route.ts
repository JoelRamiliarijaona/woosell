import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { WooCommerceClient } from '@/lib/woocommerce';

// GET /api/sites - Récupérer la liste des sites
export async function GET(request: Request) {
  try {
    // En mode développement, on ne vérifie pas l'authentification
    let userId = 'dev-user';
    if (process.env.NODE_ENV === 'production') {
      const user = await verifyToken(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.sub || 'unknown';
    }

    const db = await connectToDatabase();
    
    // Log pour le débogage
    console.log('Fetching sites for userId:', userId);
    
    const sites = await db.collection('sites')
      .find({ userId })
      .toArray();

    // Log pour le débogage
    console.log('Found sites:', sites);

    return NextResponse.json(sites);
  } catch (error) {
    // Log détaillé de l'erreur
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.sub || 'unknown';
    }

    const { domain, name, password, productType } = await request.json();
    const db = await connectToDatabase();

    // Créer le site WooCommerce
    const woocommerce = new WooCommerceClient('', '', '');
    const wooSiteResult = await woocommerce.createWooCommerceSite({
      domain,
      name,
      password,
      productType
    });

    if (!wooSiteResult.success) {
      throw new Error('Failed to create WooCommerce site');
    }

    // Sauvegarder les informations du site
    const site = {
      userId,
      domain,
      name,
      productType,
      credentials: wooSiteResult.credentials,
      createdAt: new Date(),
      updatedAt: new Date(),
      orderCount: 0,
      status: 'active'
    };

    const result = await db.collection('sites').insertOne(site);

    return NextResponse.json({ 
      message: 'Site created successfully',
      siteId: result.insertedId,
      credentials: wooSiteResult.credentials
    });

  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
