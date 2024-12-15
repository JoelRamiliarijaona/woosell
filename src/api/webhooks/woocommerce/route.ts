import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import logger, { logWebhookError } from '@/lib/logger';

interface WooCommerceOrder {
  id: string;
  siteId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
}

interface WebhookPayload {
  eventType: string;
  order: WooCommerceOrder;
}

// POST /api/webhooks/woocommerce - Recevoir les webhooks WooCommerce

'use server';

export async function POST(request: Request) {
  try {
    const payload = await request.json() as WebhookPayload;
    const db = await connectToDatabase();

    // Vérifier la signature du webhook
    const isValid = await verifyWooCommerceWebhook(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const { eventType, order } = payload;

    if (eventType !== 'order.completed') {
      return NextResponse.json({ message: 'Event ignored' });
    }

    // Traiter uniquement les commandes complétées
    if (order.status === 'completed') {
      const siteId = order.siteId; 

      // Mettre à jour le nombre de commandes pour le site
      const result = await db.collection('sites').updateOne(
        { domain: siteId },
        { 
          $inc: { orderCount: 1 },
          $set: { lastOrderAt: new Date() }
        }
      );

      if (result.matchedCount === 0) {
        const error = new Error(`Site non trouvé: ${siteId}`);
        logWebhookError(error, payload);
        
        // Créer une notification pour l'administrateur
        await db.collection('notifications').insertOne({
          userId: 'admin', 
          message: `Erreur webhook: Site non trouvé (${siteId})`,
          type: 'error',
          timestamp: new Date(),
          read: false
        });

        return NextResponse.json(
          { error: 'Site non trouvé' },
          { status: 404 }
        );
      }

      // Enregistrer la commande
      const orderDoc = {
        orderId: order.id,
        siteId: order.siteId,
        amount: order.amount,
        status: order.status,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('orders').insertOne(orderDoc);

      logger.info('Commande traitée avec succès', {
        siteId,
        orderId: order.id
      });

      return NextResponse.json({ 
        message: 'Order processed successfully',
        orderId: order.id
      });
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error) {
    const err = error as Error;
    logWebhookError(err, payload);
    
    // Créer une notification pour l'administrateur
    const db = await connectToDatabase();
    await db.collection('notifications').insertOne({
      userId: 'admin',
      message: `Erreur webhook: ${err.message}`,
      type: 'error',
      timestamp: new Date(),
      read: false
    });

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
