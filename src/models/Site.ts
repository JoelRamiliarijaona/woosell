import { Schema, model, models, Model, Types } from 'mongoose';

export interface ISite {
  userId: Types.ObjectId;
  domain: string;
  name: string;
  productType: string;
  status: 'creating' | 'active' | 'suspended' | 'deleted';
  orderCount: number;
  totalRevenue: number;
  wooCommerceDetails: {
    adminUrl: string;
    consumerKey: string;
    consumerSecret: string;
    webhookId: string;
  };
  settings: {
    automaticProductImport: boolean;
    notificationEmail: string;
    orderNotifications: boolean;
  };
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

const siteSchema = new Schema<ISite>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  domain: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true 
  },
  productType: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['creating', 'active', 'suspended', 'deleted'],
    default: 'creating'
  },
  orderCount: { 
    type: Number, 
    default: 0 
  },
  totalRevenue: { 
    type: Number, 
    default: 0 
  },
  wooCommerceDetails: {
    adminUrl: String,
    consumerKey: String,
    consumerSecret: String,
    webhookId: String
  },
  settings: {
    automaticProductImport: { 
      type: Boolean, 
      default: true 
    },
    notificationEmail: String,
    orderNotifications: { 
      type: Boolean, 
      default: true 
    }
  },
  lastSync: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes pour les performances
siteSchema.index({ userId: 1 });
siteSchema.index({ domain: 1 }, { unique: true });
siteSchema.index({ status: 1 });
siteSchema.index({ createdAt: 1 });
siteSchema.index({ orderCount: -1 });

// Méthodes virtuelles
siteSchema.virtual('monthlyOrderCount').get(function() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return this.orderCount - (this.previousMonthOrders || 0);
});

export const Site: Model<ISite> = models.Site || model<ISite>('Site', siteSchema);
