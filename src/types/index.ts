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
  productType: 'physical' | 'digital' | 'subscription';
  status: 'active' | 'inactive' | 'pending';
  totalRevenue: number;
  settings: {
    woocommerce: {
      consumerKey: string;
      consumerSecret: string;
      siteUrl: string;
      version?: string;
    };
    theme?: {
      name: string;
      version?: string;
      settings?: Record<string, unknown>;
    };
    plugins?: Array<{
      name: string;
      version?: string;
      enabled: boolean;
    }>;
  };
  lastSync: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  siteId: string;
  wooCommerceOrderId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    sku?: string;
    metadata?: Record<string, unknown>;
  }>;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Billing {
  id: string;
  userId: string;
  stripeCustomerId: string;
  subscriptionDetails: {
    stripeSubscriptionId: string;
    stripeSubscriptionItemId: string;
    planId: string;
    currentPeriod: {
      start: Date;
      end: Date;
    };
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  };
  usage: {
    orderCount: number;
    currentRevenue: number;
    lastUpdated: Date;
  };
  paymentHistory: Array<{
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed';
    date: Date;
    metadata?: Record<string, unknown>;
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
    currency?: string;
    taxId?: string;
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
    details?: unknown;
  };
  metadata?: {
    timestamp: Date;
    requestId?: string;
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
  permissions?: string[];
  metadata?: Record<string, unknown>;
}
