import type { Stripe } from 'stripe';

export interface CheckoutSession {
  id: string;
  object: 'checkout.session';
  amount_total: number;
  amount_subtotal?: number;
  currency: string;
  customer: string | null;
  customer_email: string;
  customer_details?: {
    email: string;
    name?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
  };
  metadata: {
    siteId: string;
    userId: string;
    planType: 'starter' | 'pro' | 'enterprise';
  };
  payment_status: Stripe.Checkout.Session.PaymentStatus;
  payment_intent?: string;
  status: Stripe.Checkout.Session.Status;
  subscription?: string;
  success_url: string;
  cancel_url: string;
  created: number;
  expires_at: number;
}

export interface StripeEvent {
  id: string;
  object: 'event';
  type: Stripe.WebhookEndpointCreateParams.EnabledEvent;
  data: {
    object: CheckoutSession | Stripe.Subscription | Stripe.Invoice;
    previous_attributes?: Partial<CheckoutSession | Stripe.Subscription | Stripe.Invoice>;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string | null;
    idempotency_key: string | null;
  };
}

export interface StripeSubscription {
  id: string;
  object: 'subscription';
  status: Stripe.Subscription.Status;
  customer: string;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  ended_at?: number;
  trial_end?: number;
  metadata?: Record<string, string>;
}
