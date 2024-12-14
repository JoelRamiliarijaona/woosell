import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createCustomer(email: string, name: string) {
  return stripe.customers.create({
    email,
    name,
  });
}

export async function createSubscription(customerId: string) {
  // Créer un abonnement de base à 1€/mois
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_BASE_PRICE_ID }], // Prix de base mensuel
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
}

export async function updateUsageForCustomer(subscriptionItemId: string, quantity: number) {
  // Mettre à jour l'utilisation pour la facturation basée sur l'utilisation
  return stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'set',
    }
  );
}

export async function getCustomerPortalUrl(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });
  return session.url;
}
