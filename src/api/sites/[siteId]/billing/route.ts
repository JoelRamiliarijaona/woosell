import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ApiResponse } from '@/types';
import { SiteModel, type SiteType } from '@/lib/models/website';

// Constantes de facturation
const BASE_PRICE = 1; // Prix de base en euros
const PRICE_PER_ORDER = 0.5; // Prix par commande en euros

interface BillingStats {
  currentMonth: {
    orderCount: number;
    amount: number;
    startDate: Date;
    endDate: Date;
  };
  previousMonth: {
    orderCount: number;
    amount: number;
    startDate: Date;
    endDate: Date;
  };
}

// GET /api/sites/[siteId]/billing - Obtenir les statistiques de facturation
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    // Vérifier l'authentification
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
        { status: 401 }
      );
    }

    // Vérifier que le siteId est valide
    if (!ObjectId.isValid(params.siteId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'ID de site invalide'
          }
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Vérifier que le site existe et appartient à l'utilisateur
    const site = await SiteModel.findOne({
      _id: new ObjectId(params.siteId),
      userId: session.user.id
    }).lean() as SiteType | null;

    if (!site) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Site non trouvé'
          }
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // Obtenir le premier jour du mois en cours
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Obtenir le premier jour du mois précédent
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const db = await getMongoDb();

    // Obtenir les commandes du mois en cours
    const currentMonthOrders = await db.collection('orders').countDocuments({
      siteId: site.storeId,
      createdAt: {
        $gte: currentMonthStart,
        $lte: currentMonthEnd
      },
      status: 'completed'
    });

    // Obtenir les commandes du mois précédent
    const previousMonthOrders = await db.collection('orders').countDocuments({
      siteId: site.storeId,
      createdAt: {
        $gte: previousMonthStart,
        $lte: previousMonthEnd
      },
      status: 'completed'
    });

    // Calculer les montants
    const calculateAmount = (orderCount: number) => {
      return Number((BASE_PRICE + (orderCount * PRICE_PER_ORDER)).toFixed(2));
    };

    const billingStats: BillingStats = {
      currentMonth: {
        orderCount: currentMonthOrders,
        amount: calculateAmount(currentMonthOrders),
        startDate: currentMonthStart,
        endDate: currentMonthEnd
      },
      previousMonth: {
        orderCount: previousMonthOrders,
        amount: calculateAmount(previousMonthOrders),
        startDate: previousMonthStart,
        endDate: previousMonthEnd
      }
    };

    return NextResponse.json({
      success: true,
      data: billingStats,
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<BillingStats>);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de facturation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Erreur interne du serveur',
          details: error instanceof Error ? error.stack : undefined
        },
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
