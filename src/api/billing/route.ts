import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// GET /api/billing - Récupérer les informations de facturation
export async function GET(request: Request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    // Récupérer tous les sites de l'utilisateur
    const sites = await db.collection('sites').find({
      userId: user.sub
    }).toArray();

    // Calculer le nombre total de commandes
    const totalOrders = sites.reduce((acc, site) => acc + (site.orderCount || 0), 0);

    // Calculer les frais
    const monthlyFee = 1; // Frais mensuel de base
    const orderFee = totalOrders * 0.5; // 0.50€ par commande
    const totalAmount = monthlyFee + orderFee;

    return NextResponse.json({
      totalOrders,
      monthlyFee,
      orderFee,
      totalAmount
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
