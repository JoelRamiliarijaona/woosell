import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { connectToDatabase } from '@/lib/mongodb';
import { Types } from 'mongoose';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = headers().get('stripe-signature');

    if (!sig || !endpointSecret) {
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
    }

    // Vérifier la signature de l'événement
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Erreur de signature webhook:', err);
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
    }

    // Gérer l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { siteId, userId, planType } = session.metadata!;

      // Connexion à la base de données
      const { db } = await connectToDatabase();
      if (!db) {
        throw new Error('La connexion à la base de données a échoué');
      }

      // Mettre à jour le site avec les informations de paiement
      await db.collection('sites').updateOne(
        { _id: new Types.ObjectId(siteId) },
        {
          $set: {
            'subscription.status': 'active',
            'subscription.planType': planType,
            'subscription.stripeCustomerId': session.customer,
            'subscription.stripeSubscriptionId': session.subscription,
            'subscription.currentPeriodEnd': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            updatedAt: new Date(),
          },
        }
      );

      // Envoyer un email de confirmation
      // TODO: Implémenter l'envoi d'email
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook Stripe:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    );
  }
}
