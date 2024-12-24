import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMongoDb } from '@/lib/mongodb';
import { ApiResponse } from '@/types';
interface BillingData {
  id?: string;
  usage?: {
    orderCount: number;
  };
  // Ajoutez d'autres champs selon votre structure
}

export async function GET() {
  try {
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

    const db = await getMongoDb();
    const billingData = await db.collection('billing').find({}).toArray();

    return NextResponse.json({
      success: true,
      data: billingData,
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<BillingData[]>);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de facturation:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la récupération des données de facturation',
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

export async function POST(request: Request) {
  try {
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

    const data = await request.json();
    const db = await getMongoDb();
    
    const result = await db.collection('billing').insertOne({
      ...data,
      userId: session.user.id,
      createdAt: new Date(),
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId,
        ...data
      },
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<BillingData>);
  } catch (error) {
    console.error('Erreur lors de la création des données de facturation:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la création des données de facturation',
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
