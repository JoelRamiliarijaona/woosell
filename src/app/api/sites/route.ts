import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { authOptions, isAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { ApiResponse, Site as SiteType } from '@/types';
import { WooCommerceClient } from '@/lib/woocommerce';
import { SiteModel } from '@/lib/models/website';

export const maxDuration = 1200; // 20 minutes en secondes

// Configuration des headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler pour les requêtes OPTIONS (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Non autorisé'
          }
        } as ApiResponse<never>,
        { 
          status: 401,
          headers: corsHeaders
        }
      );
    }

    // Vérifier la connexion MongoDB
    try {
      await getMongoDb();
    } catch (dbError) {
      console.error('Erreur de connexion MongoDB:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Erreur de connexion à la base de données',
            details: dbError instanceof Error ? dbError.message : 'Unknown error'
          }
        } as ApiResponse<never>,
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // Construire la requête en fonction du rôle de l'utilisateur
    const query = isAdmin(session) ? {} : { userId: session.user.id };
    
    // Utiliser le modèle Mongoose avec un timeout explicite
    const sites = await Promise.race([
      SiteModel.find(query)
        .select('-apiSecret')
        .lean()
        .exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]);

    return NextResponse.json(
      {
        success: true,
        data: sites,
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<SiteType[]>,
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des sites:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Erreur lors de la récupération des sites',
          details: error instanceof Error ? error.stack : undefined
        },
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<never>,
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Non autorisé'
          }
        } as ApiResponse<never>,
        { 
          status: 401,
          headers: corsHeaders
        }
      );
    }

    const data = await request.json();

    if (!data.domain || !data.name || !data.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Données manquantes pour la création du site'
          }
        } as ApiResponse<never>,
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    console.log('Creating site with data:', {
      domain: data.domain,
      name: data.name,
      userId: session.user.id
    });

    // Créer le site WooCommerce
    const wooClient = new WooCommerceClient(
      process.env.WOOCOMMERCE_KEY || '',
      process.env.WOOCOMMERCE_SECRET || '',
      process.env.WOOCOMMERCE_URL || ''
    );
    
    try {
      console.log('Calling WooCommerceClient.createWooCommerceSite...');
      const wooResponse = await wooClient.createWooCommerceSite({
        domain: data.domain,
        name: data.name,
        password: data.password,
        userId: session.user.id
      });

      console.log('WooCommerce response:', wooResponse);

      if (!wooResponse.success) {
        console.error('WooCommerce site creation failed:', wooResponse.error);
        return NextResponse.json(
          {
            success: false,
            error: wooResponse.error,
            metadata: {
              timestamp: new Date()
            }
          },
          { 
            status: 400,
            headers: corsHeaders
          }
        );
      }

      // Vérifier la connexion MongoDB
      if (mongoose.connection.readyState !== 1) {
        console.error('MongoDB connection is not ready. State:', mongoose.connection.readyState);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MONGODB_CONNECTION_ERROR',
              message: 'La connexion à MongoDB n\'est pas établie',
              details: { connectionState: mongoose.connection.readyState }
            }
          },
          { 
            status: 500,
            headers: corsHeaders
          }
        );
      }

      console.log('Site created successfully:', wooResponse);

      return NextResponse.json({
        success: true,
        data: wooResponse.data,
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<typeof wooResponse.data>,
      { 
        headers: corsHeaders
      });

    } catch (wooError) {
      console.error('Error creating WooCommerce site:', wooError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WOOCOMMERCE_API_ERROR',
            message: wooError instanceof Error ? wooError.message : 'Erreur lors de la création du site WooCommerce',
            details: wooError instanceof Error ? wooError.stack : undefined
          }
        } as ApiResponse<never>,
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

  } catch (error) {
    console.error('Erreur détaillée lors de la création du site:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du site',
          details: error instanceof Error ? error.stack : undefined
        },
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<never>,
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
