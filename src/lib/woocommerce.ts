import crypto from 'crypto';

interface WooCommerceWebhookHeaders {
  'x-wc-webhook-signature': string;
  'x-wc-webhook-source': string;
  'x-wc-webhook-topic': string;
  'x-wc-webhook-resource': string;
  'x-wc-webhook-event': string;
  'x-wc-webhook-id': string;
}

export async function verifyWooCommerceWebhook(request: Request): Promise<boolean> {
  try {
    if (!process.env.WOOCOMMERCE_WEBHOOK_SECRET) {
      throw new Error('WOOCOMMERCE_WEBHOOK_SECRET is not defined in environment variables');
    }

    const signature = request.headers.get('x-wc-webhook-signature');
    if (!signature) {
      console.error('No webhook signature found in headers');
      return false;
    }

    // Get the raw body
    const rawBody = await request.text();
    const body = rawBody.length > 0 ? rawBody : '';

    // Create HMAC
    const hmac = crypto.createHmac('sha256', process.env.WOOCOMMERCE_WEBHOOK_SECRET);
    hmac.update(body);
    const calculatedSignature = hmac.digest('base64');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (error) {
    console.error('Error verifying WooCommerce webhook:', error);
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
  ): Promise<T> {
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
      throw new Error(`WooCommerce API error: ${response.statusText}`);
    }

    return response.json();
  }

  async setupOrderWebhook(backendUrl: string, consumerKey: string, consumerSecret: string): Promise<void> {
    try {
      const endpoint = `${this.siteUrl}/wp-json/wc/v3/webhooks`;
      const webhookData = {
        name: "Commandes finalisées",
        topic: "order.completed",
        delivery_url: `${backendUrl}/api/webhooks/woocommerce`,
        status: "active"
      };

      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create webhook: ${JSON.stringify(error)}`);
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
  }): Promise<any> {
    try {
      const response = await fetch('http://104.21.30.216:7999/create-woocommerce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create WooCommerce site: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      
      // Une fois le site créé, configurer le webhook
      if (data.success) {
        await this.setupOrderWebhook(
          process.env.BACKEND_URL || 'http://localhost:3000',
          data.credentials.consumer_key,
          data.credentials.consumer_secret
        );
      }

      return data;
    } catch (error) {
      console.error('Error creating WooCommerce site:', error);
      throw error;
    }
  }

  // Orders
  async getOrders() {
    return this.request<any[]>('orders');
  }

  async getOrder(orderId: number) {
    return this.request<any>(`orders/${orderId}`);
  }

  // Products
  async getProducts() {
    return this.request<any[]>('products');
  }

  async getProduct(productId: number) {
    return this.request<any>(`products/${productId}`);
  }

  // Customers
  async getCustomers() {
    return this.request<any[]>('customers');
  }

  async getCustomer(customerId: number) {
    return this.request<any>(`customers/${customerId}`);
  }
}
