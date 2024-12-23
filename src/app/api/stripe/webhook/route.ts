import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig || !endpointSecret) {
      return NextResponse.json(
        { error: 'Missing signature or endpoint secret' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    const db = await getMongoDb();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const siteId = session.metadata?.siteId;

        if (!siteId) {
          throw new Error('No siteId found in session metadata');
        }

        await db.collection('sites').updateOne(
          { _id: new ObjectId(siteId) },
          {
            $set: {
              'billing.status': 'active',
              'billing.stripeCustomerId': session.customer,
              'billing.subscriptionId': session.subscription,
              'billing.updatedAt': new Date()
            }
          }
        );

        break;
      }
      // Ajoutez d'autres cas pour gérer différents types d'événements Stripe
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
