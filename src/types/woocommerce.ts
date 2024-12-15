export interface WooCommerceOrder {
  id: number;
  amount: number;
  status: string;
  siteId: string;
  customer_email?: string;
  billing?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  date_created: string;
  total: string;
}

export interface WooCommerceWebhookPayload {
  eventType: string;
  order: WooCommerceOrder;
}
