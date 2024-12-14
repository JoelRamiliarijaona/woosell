export interface Site {
  id: string;
  userId: string;
  domain: string;
  name: string;
  productType: string;
  orderCount: number;
  createdAt: Date;
  wooCommerceDetails: {
    adminUrl: string;
    consumerKey: string;
    consumerSecret: string;
  };
}

export interface CreateSiteInput {
  domain: string;
  name: string;
  password: string;
  productType: string;
}

export interface WooCommerceOrder {
  id: number;
  amount: number;
  status: string;
  siteId: string;
}
