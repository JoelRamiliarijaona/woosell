import crypto from 'crypto';

interface WooCommerceWebhookHeaders {
  'x-wc-webhook-signature': string;
  'x-wc-webhook-source': string;
  'x-wc-webhook-topic': string;
  'x-wc-webhook-resource': string;
  'x-wc-webhook-event': string;
  'x-wc-webhook-id': string;
}

interface WooCommerceResponse<T> {
  data: T;
  status: number;
}

interface WooCommerceError {
  code: string;
  message: string;
  data?: unknown;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  status: string;
}

interface WooCommerceOrder {
  id: number;
  status: string;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
  line_items: Array<{
    product_id: number;
    quantity: number;
    total: string;
  }>;
}

export async function verifyWooCommerceWebhook(request: Request): Promise<boolean> {
  try {
    const signature = request.headers.get('x-wc-webhook-signature');
    if (!signature) {
      return false;
    }

    const payload = await request.text();
    const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
    
    if (!secret) {
      throw new Error('WOOCOMMERCE_WEBHOOK_SECRET is not defined');
    }

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return false;
  }
}

export class WooCommerceClient {
  private consumerKey: string;
  private consumerSecret: string;
  private siteUrl: string;

  constructor(
    consumerKey: string,
    consumerSecret: string,
    siteUrl: string
  ) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.siteUrl = siteUrl;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: unknown
  ): Promise<WooCommerceResponse<T>> {
    const url = new URL(`${this.siteUrl}/wp-json/wc/v3/${endpoint}`);
    url.searchParams.append('consumer_key', this.consumerKey);
    url.searchParams.append('consumer_secret', this.consumerSecret);

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error: WooCommerceError = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async setupOrderWebhook(backendUrl: string): Promise<void> {
    try {
      const endpoint = `${this.siteUrl}/wp-json/wc/v3/webhooks`;
      const webhookData = {
        name: "Commandes finalisées",
        topic: "order.completed",
        delivery_url: `${backendUrl}/api/webhooks/woocommerce`,
        status: "active"
      };

      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        const error: WooCommerceError = await response.json();
        throw new Error(`Failed to create webhook: ${error.message}`);
      }

      console.log('Webhook configured successfully for site:', this.siteUrl);
    } catch (error) {
      console.error('Error setting up webhook:', error);
      throw error;
    }
  }

  async createWooCommerceSite(siteData: {
    domain: string;
    name: string;
    password: string;
    productType: string;
  }): Promise<WooCommerceResponse<unknown>> {
    try {
      const response = await fetch('http://104.21.30.216:7999/create-woocommerce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData)
      });

      if (!response.ok) {
        const error: WooCommerceError = await response.json();
        throw new Error(`Failed to create WooCommerce site: ${error.message}`);
      }

      const data = await response.json();
      
      // Une fois le site créé, configurer le webhook
      if (data.success) {
        await this.setupOrderWebhook(
          process.env.BACKEND_URL || 'http://localhost:3000',
        );
      }

      return data;
    } catch (error) {
      console.error('Error creating WooCommerce site:', error);
      throw error;
    }
  }

  // Orders
  async getOrders(): Promise<WooCommerceResponse<WooCommerceOrder[]>> {
    return this.request<WooCommerceOrder[]>('orders');
  }

  async getOrder(orderId: number): Promise<WooCommerceResponse<WooCommerceOrder>> {
    return this.request<WooCommerceOrder>(`orders/${orderId}`);
  }

  // Products
  async getProducts(): Promise<WooCommerceResponse<WooCommerceProduct[]>> {
    return this.request<WooCommerceProduct[]>('products');
  }

  async getProduct(productId: number): Promise<WooCommerceResponse<WooCommerceProduct>> {
    return this.request<WooCommerceProduct>(`products/${productId}`);
  }

  // Customers
  async getCustomers(): Promise<WooCommerceResponse<unknown[]>> {
    return this.request<unknown[]>('customers');
  }

  async getCustomer(customerId: number): Promise<WooCommerceResponse<unknown>> {
    return this.request<unknown>(`customers/${customerId}`);
  }
}
