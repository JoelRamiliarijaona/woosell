import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { Site, Billing, ApiResponse } from '@/types';

interface BillingResponse {
  totalOrders: number;
  monthlyFee: number;
  orderFee: number;
  totalAmount: number;
  currentPeriod?: {
    start: Date;
    end: Date;
  };
  status?: string;
  usage?: {
    orderCount: number;
    currentRevenue: number;
  };
}

// GET /api/billing - Récupérer les informations de facturation
export async function GET(request: Request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Non autorisé'
          }
        } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const db = await getMongoDb();
    
    // Récupérer la facturation de l'utilisateur
    const billing = await db.collection<Billing>('billing').findOne({
      userId: user.sub
    });

    // Calculer le total des revenus et des commandes
    const totalOrders = billing?.usage?.orderCount || 0;

    // Calculer les frais
    const monthlyFee = 1; // Frais mensuel de base
    const orderFee = totalOrders * 0.5; // 0.50€ par commande
    const totalAmount = monthlyFee + orderFee;

    const response: ApiResponse<BillingResponse> = {
      success: true,
      data: {
        totalOrders,
        monthlyFee,
        orderFee,
        totalAmount,
        currentPeriod: billing?.subscriptionDetails?.currentPeriod,
        status: billing?.subscriptionDetails?.status,
        usage: billing?.usage && {
          orderCount: billing.usage.orderCount,
          currentRevenue: billing.usage.currentRevenue
        }
      },
      metadata: {
        timestamp: new Date()
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching billing data:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      },
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<never>, { 
      status: 500 
    });
  }
}
