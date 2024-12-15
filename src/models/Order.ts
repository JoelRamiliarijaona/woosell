import { Schema, model, models, Model, Types } from 'mongoose';

export interface IOrder {
  siteId: Types.ObjectId;
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
  shippingDetails: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  paymentMethod: string;
  currency: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>({
  siteId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Site', 
    required: true 
  },
  wooCommerceOrderId: { 
    type: String, 
    required: true 
  },
  customerId: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    required: true 
  },
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number
  }],
  shippingDetails: {
    address: String,
    city: String,
    country: String,
    postalCode: String
  },
  paymentMethod: { 
    type: String 
  },
  currency: { 
    type: String, 
    default: 'EUR' 
  },
  billingPeriod: {
    start: Date,
    end: Date
  },
  metadata: { 
    type: Schema.Types.Mixed 
  }
}, {
  timestamps: true
});

// Indexes pour les performances
orderSchema.index({ siteId: 1, createdAt: -1 });
orderSchema.index({ wooCommerceOrderId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'billingPeriod.start': 1, 'billingPeriod.end': 1 });
orderSchema.index({ customerId: 1 });

// Méthodes statiques
orderSchema.statics.getTotalRevenueForSite = async function(siteId: Types.ObjectId) {
  const result = await this.aggregate([
    { $match: { siteId, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result[0]?.total || 0;
};

export const Order: Model<IOrder> = models.Order || model<IOrder>('Order', orderSchema);
