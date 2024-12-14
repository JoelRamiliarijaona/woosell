export interface User {
  id: string;
  keycloakId: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Site {
  id: string;
  userId: string;
  domain: string;
  name: string;
  productType: string;
  status: 'active' | 'inactive' | 'pending';
  totalRevenue: number;
  settings: {
    woocommerce: {
      consumerKey: string;
      consumerSecret: string;
      siteUrl: string;
    };
    theme?: string;
    plugins?: string[];
  };
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  siteId: string;
  wooCommerceOrderId: string;
  customerId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Billing {
  id: string;
  userId: string;
  stripeCustomerId: string;
  subscriptionDetails: {
    stripeSubscriptionId: string;
    stripeSubscriptionItemId: string;
    currentPeriod: {
      start: Date;
      end: Date;
    };
    status: 'active' | 'canceled' | 'past_due';
  };
  usage: {
    orderCount: number;
    currentRevenue: number;
  };
  paymentHistory: Array<{
    id: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    date: Date;
  }>;
  invoiceSettings: {
    email: string;
    billingAddress?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface CreateSiteFormData {
  domain: string;
  name: string;
  productType: string;
  woocommerce: {
    consumerKey: string;
    consumerSecret: string;
    siteUrl: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}
