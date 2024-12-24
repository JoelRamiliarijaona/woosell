import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMongoDb } from '@/lib/mongodb';
import { ApiResponse } from '@/types';

export async function POST() {
  // Ne pas exécuter pendant le build
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BUILD_TIME',
          message: 'Cette route n\'est pas disponible pendant le build'
        }
      } as ApiResponse<never>,
      { status: 503 }
    );
  }

  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('admin')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Non autorisé - Accès administrateur requis'
          }
        } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Connexion à la base de données
    const db = await getMongoDb();

    // Vider les collections
    await db.collection('sites').deleteMany({});
    await db.collection('billing').deleteMany({});
    await db.collection('notifications').deleteMany({});
    await db.collection('orders').deleteMany({});

    return NextResponse.json({ 
      success: true,
      data: {
        message: 'Collections vidées avec succès',
        collections: ['sites', 'billing', 'notifications', 'orders']
      },
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<{
      message: string;
      collections: string[];
    }>);
  } catch (error) {
    console.error('Erreur lors du nettoyage des collections:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors du nettoyage des collections',
          details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
        },
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
