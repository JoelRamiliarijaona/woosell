import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Constantes de facturation
const BASE_PRICE = 1; // Prix de base en euros
const PRICE_PER_ORDER = 0.5; // Prix par commande en euros

// GET /api/sites/[siteId]/billing - Obtenir les statistiques de facturation
export async function GET(
  request: Request,
  { params }: { params: { siteId: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    const siteId = params.siteId;

    // Vérifier que le site existe et appartient à l'utilisateur
    const site = await db.collection('sites').findOne({
      _id: new ObjectId(siteId),
      userId: session.user.id
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Obtenir le premier jour du mois en cours
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Obtenir le premier jour du mois précédent
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Obtenir les commandes du mois en cours
    const currentMonthOrders = await db.collection('orders').countDocuments({
      siteId: site.domain,
      createdAt: {
        $gte: currentMonthStart,
        $lte: currentMonthEnd
      },
      status: 'completed'
    });

    // Obtenir les commandes du mois précédent
    const previousMonthOrders = await db.collection('orders').countDocuments({
      siteId: site.domain,
      createdAt: {
        $gte: previousMonthStart,
        $lte: previousMonthEnd
      },
      status: 'completed'
    });

    // Calculer les montants
    const calculateAmount = (orderCount: number) => {
      return BASE_PRICE + (orderCount * PRICE_PER_ORDER);
    };

    const currentMonthAmount = calculateAmount(currentMonthOrders);
    const previousMonthAmount = calculateAmount(previousMonthOrders);

    return NextResponse.json({
      currentMonth: {
        orderCount: currentMonthOrders,
        amount: currentMonthAmount,
        startDate: currentMonthStart,
        endDate: currentMonthEnd
      },
      previousMonth: {
        orderCount: previousMonthOrders,
        amount: previousMonthAmount,
        startDate: previousMonthStart,
        endDate: previousMonthEnd
      }
    });
  } catch (error) {
    console.error('Error getting billing stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
