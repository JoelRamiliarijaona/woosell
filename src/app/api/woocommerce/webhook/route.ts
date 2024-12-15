import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { WooCommerceWebhookPayload } from '@/types/woocommerce';
import { Types } from 'mongoose';

const WEBHOOK_SECRET = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

// Fonction pour vérifier la signature du webhook
function verifyWooCommerceWebhook(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier la signature du webhook
    const payload = await request.text();
    const signature = headers().get('x-wc-webhook-signature');
    
    if (!signature || !verifyWooCommerceWebhook(payload, signature)) {
      console.error('Signature webhook invalide');
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    // Parser le payload
    const webhookData = JSON.parse(payload) as WooCommerceWebhookPayload;
    console.log('Webhook reçu:', webhookData);

    // Connexion à la base de données
    const { db } = await connectToDatabase();
    if (!db) {
      throw new Error('La connexion à la base de données a échoué');
    }

    // Traiter l'événement selon son type
    if (webhookData.eventType === 'order.completed') {
      const { order } = webhookData;

      // Mettre à jour les statistiques du site
      await db.collection('sites').updateOne(
        { _id: new Types.ObjectId(order.siteId) },
        {
          $inc: {
            orderCount: 1,
            totalRevenue: parseFloat(order.total)
          },
          $set: {
            lastOrderDate: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Enregistrer la commande dans notre base de données
      await db.collection('orders').insertOne({
        orderId: order.id,
        siteId: new Types.ObjectId(order.siteId),
        amount: parseFloat(order.total),
        status: order.status,
        customerEmail: order.billing?.email || order.customer_email,
        customerName: order.billing ? `${order.billing.first_name} ${order.billing.last_name}` : '',
        items: order.line_items,
        createdAt: new Date(order.date_created),
        updatedAt: new Date()
      });

      // TODO: Envoyer une notification par email
      // await sendOrderNotification(order);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    );
  }
}
