import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import logger, { logWebhookError } from '@/lib/logger';
import { verifyWooCommerceWebhook } from '@/lib/woocommerce';
import { Site, Order, Notification, ApiResponse } from '@/types';
import { ObjectId, OptionalId } from 'mongodb';

interface WooCommerceWebhookOrder {
  id: string;
  site_url: string;
  total: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  currency: string;
  customer_id: string;
  line_items: Array<{
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
}

interface WebhookPayload {
  event: string;
  order: WooCommerceWebhookOrder;
}

// POST /api/webhooks/woocommerce - Recevoir les webhooks WooCommerce
export async function POST(request: Request) {
  let payload: WebhookPayload | undefined;
  
  try {
    payload = await request.json() as WebhookPayload;
    const db = await getMongoDb();

    // Vérifier la signature du webhook
    const isValid = await verifyWooCommerceWebhook(request);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Signature du webhook invalide'
          }
        } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const { event, order } = payload;

    if (event !== 'order.completed') {
      return NextResponse.json({
        success: true,
        data: { message: 'Événement ignoré' }
      } as ApiResponse<{ message: string }>);
    }

    // Traiter uniquement les commandes complétées
    if (order.status === 'completed') {
      // Trouver le site correspondant à l'URL
      const site = await db.collection<Site>('sites').findOne({
        'settings.woocommerce.siteUrl': order.site_url
      });

      if (!site) {
        const error = new Error(`Site non trouvé: ${order.site_url}`);
        logWebhookError(error, payload);
        
        // Créer une notification pour l'administrateur
        const notification: OptionalId<Notification> = {
          id: new ObjectId().toHexString(),
          userId: 'admin',
          message: `Erreur webhook: Site non trouvé (${order.site_url})`,
          type: 'error',
          timestamp: new Date(),
          read: false
        };
        
        await db.collection<OptionalId<Notification>>('notifications').insertOne(notification);

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SITE_NOT_FOUND',
              message: 'Site non trouvé',
              details: order.site_url
            }
          } as ApiResponse<never>,
          { status: 404 }
        );
      }

      // Mettre à jour les statistiques du site
      await db.collection<Site>('sites').updateOne(
        { _id: new ObjectId(site._id) },
        { 
          $inc: { totalRevenue: parseFloat(order.total) },
          $set: { updatedAt: new Date() }
        }
      );

      // Enregistrer la commande
      const newOrder: OptionalId<Order> = {
        id: new ObjectId().toHexString(),
        siteId: site.id,
        wooCommerceOrderId: order.id,
        customerId: order.customer_id,
        amount: parseFloat(order.total),
        currency: order.currency,
        status: order.status,
        items: order.line_items.map(item => ({
          productId: item.product_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku
        })),
        billingPeriod: {
          start: new Date(),
          end: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection<OptionalId<Order>>('orders').insertOne(newOrder);

      logger.info('Commande traitée avec succès', {
        siteId: site.id,
        orderId: order.id
      });

      return NextResponse.json({ 
        success: true,
        data: {
          message: 'Commande traitée avec succès',
          orderId: result.insertedId.toHexString()
        }
      } as ApiResponse<{ message: string; orderId: string }>);
    }

    return NextResponse.json({
      success: true,
      data: { status: 'ignored' }
    } as ApiResponse<{ status: string }>);
  } catch (error) {
    const err = error as Error;
    logWebhookError(err, payload);
    
    // Créer une notification pour l'administrateur
    const db = await getMongoDb();
    const notification: OptionalId<Notification> = {
      id: new ObjectId().toHexString(),
      userId: 'admin',
      message: `Erreur webhook: ${err.message}`,
      type: 'error',
      timestamp: new Date(),
      read: false
    };

    await db.collection<OptionalId<Notification>>('notifications').insertOne(notification);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur serveur',
          details: err.message
        },
        metadata: {
          timestamp: new Date()
        }
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
