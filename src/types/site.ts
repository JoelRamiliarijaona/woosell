export interface Site {
  id: string;
  userId: string;
  domain: string;
  name: string;
  productType: 'physical' | 'digital' | 'subscription';
  status: 'active' | 'inactive' | 'pending' | 'error';
  orderCount: number;
  revenue: {
    total: number;
    currency: string;
    lastUpdated: Date;
  };
  settings: {
    theme?: {
      name: string;
      version?: string;
      customizations?: Record<string, unknown>;
    };
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
    analytics?: {
      googleAnalyticsId?: string;
      facebookPixelId?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
  wooCommerceDetails: {
    adminUrl: string;
    consumerKey: string;
    consumerSecret: string;
    version?: string;
    settings?: {
      currency: string;
      currencyPosition: 'left' | 'right' | 'left_space' | 'right_space';
      thousandSeparator: string;
      decimalSeparator: string;
      priceNumDecimals: number;
      taxStatus: 'enabled' | 'disabled';
      taxIncludedInPrice: boolean;
    };
    ssl?: {
      enabled: boolean;
      validUntil?: Date;
    };
  };
  errorLogs?: Array<{
    timestamp: Date;
    type: 'sync' | 'api' | 'system';
    message: string;
    details?: Record<string, unknown>;
  }>;
}

export interface CreateSiteInput {
  domain: string;
  name: string;
  password: string;
  productType: 'physical' | 'digital' | 'subscription';
  settings?: {
    theme?: {
      name: string;
      customizations?: Record<string, unknown>;
    };
    seo?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
  };
  wooCommerceSettings?: {
    currency?: string;
    taxStatus?: 'enabled' | 'disabled';
    taxIncludedInPrice?: boolean;
  };
}

export interface UpdateSiteInput {
  name?: string;
  domain?: string;
  status?: 'active' | 'inactive';
  settings?: Site['settings'];
  wooCommerceDetails?: Partial<Site['wooCommerceDetails']>;
}

export interface SiteStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  currency: string;
  periodComparison: {
    orders: {
      current: number;
      previous: number;
      percentageChange: number;
    };
    revenue: {
      current: number;
      previous: number;
      percentageChange: number;
    };
  };
  topProducts: Array<{
    id: number;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: number;
    date: Date;
    status: string;
    total: number;
    customerName: string;
  }>;
}

export interface WooCommerceOrder {
  id: number;
  amount: number;
  status: string;
  siteId: string;
}
