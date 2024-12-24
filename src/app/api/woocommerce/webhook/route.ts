import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getMongoDb } from '@/lib/mongodb';
import { WooCommerceWebhookPayload } from '@/types/woocommerce';
import { ObjectId } from 'mongodb';
import { ApiResponse } from '@/types';
import { verifyWooCommerceWebhook } from '@/lib/webhookUtils';

const WEBHOOK_SECRET = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Vérifier la signature du webhook
    const payload = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-wc-webhook-signature');
    
    if (!signature || !verifyWooCommerceWebhook(payload, signature)) {
      console.error('Signature webhook invalide');
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Signature invalide'
          }
        } as ApiResponse<never>,
        { status: 401 }
      );
    }

    // Parser le payload
    const webhookData = JSON.parse(payload) as WooCommerceWebhookPayload;
    console.log('Webhook reçu:', webhookData);

    const db = await getMongoDb();

    // Traiter l'événement selon son type
    if (webhookData.eventType === 'created' && webhookData.order.status === 'completed') {
      const order = webhookData.order;

      // Mettre à jour les statistiques du site
      const siteId = new ObjectId(); // TODO: Récupérer le siteId depuis les métadonnées de la commande
      await db.collection('sites').updateOne(
        { _id: siteId },
        {
          $inc: {
            totalRevenue: parseFloat(order.total)
          },
          $set: {
            lastSync: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Enregistrer la commande dans notre base de données
      await db.collection('orders').insertOne({
        wooCommerceOrderId: order.id.toString(),
        siteId: siteId,
        customerId: order.customer_id.toString(),
        amount: parseFloat(order.total),
        currency: order.currency,
        status: order.status,
        items: order.line_items.map(item => ({
          productId: item.product_id.toString(),
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku
        })),
        billingPeriod: {
          start: new Date(order.date_created),
          end: new Date(order.date_created) // TODO: Calculer la fin de période pour les abonnements
        },
        metadata: {
          billing: order.billing,
          shipping: order.shipping,
          payment_method: order.payment_method
        },
        createdAt: new Date(order.date_created),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      metadata: {
        timestamp: new Date()
      }
    } as ApiResponse<void>);
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: 'Erreur lors du traitement du webhook',
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