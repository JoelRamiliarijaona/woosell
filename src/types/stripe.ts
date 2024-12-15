export interface CheckoutSession {
  id: string;
  object: string;
  amount_total: number;
  currency: string;
  customer_email: string;
  metadata: {
    siteId: string;
    userId: string;
    planType: string;
  };
  payment_status: string;
  status: string;
}

export interface StripeEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: CheckoutSession;
  };
}
