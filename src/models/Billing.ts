import { Schema, model, models, Model, Types } from 'mongoose';

export interface IBilling {
  userId: Types.ObjectId;
  stripeCustomerId: string;
  subscriptionDetails: {
    stripeSubscriptionId: string;
    stripeSubscriptionItemId: string;
    status: 'active' | 'past_due' | 'canceled' | 'unpaid';
    currentPeriod: {
      start: Date;
      end: Date;
    };
  };
  usage: {
    orderCount: number;
    baseAmount: number;
    usageAmount: number;
    totalAmount: number;
  };
  paymentHistory: Array<{
    date: Date;
    amount: number;
    status: 'succeeded' | 'failed' | 'pending';
    stripePaymentIntentId: string;
  }>;
  invoiceSettings: {
    email: string;
    businessName?: string;
    vatNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const billingSchema = new Schema<IBilling>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  stripeCustomerId: { 
    type: String, 
    required: true 
  },
  subscriptionDetails: {
    stripeSubscriptionId: { 
      type: String, 
      required: true 
    },
    stripeSubscriptionItemId: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['active', 'past_due', 'canceled', 'unpaid'],
      default: 'active'
    },
    currentPeriod: {
      start: { 
        type: Date, 
        required: true 
      },
      end: { 
        type: Date, 
        required: true 
      }
    }
  },
  usage: {
    orderCount: { 
      type: Number, 
      default: 0 
    },
    baseAmount: { 
      type: Number, 
      default: 1 
    },
    usageAmount: { 
      type: Number, 
      default: 0 
    },
    totalAmount: { 
      type: Number, 
      default: 1 
    }
  },
  paymentHistory: [{
    date: { 
      type: Date, 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['succeeded', 'failed', 'pending'],
      required: true 
    },
    stripePaymentIntentId: { 
      type: String, 
      required: true 
    }
  }],
  invoiceSettings: {
    email: { 
      type: String, 
      required: true 
    },
    businessName: String,
    vatNumber: String
  }
}, {
  timestamps: true
});

// Indexes pour les performances
billingSchema.index({ userId: 1 });
billingSchema.index({ stripeCustomerId: 1 });
billingSchema.index({ 'subscriptionDetails.status': 1 });
billingSchema.index({ 'subscriptionDetails.currentPeriod.end': 1 });
billingSchema.index({ 'paymentHistory.date': -1 });

// Méthodes statiques
billingSchema.statics.calculateMonthlyBill = async function(userId: Types.ObjectId) {
  const billing = await this.findOne({ userId });
  if (!billing) return null;

  const orderCount = billing.usage.orderCount;
  const baseAmount = 1; // 1€ de base
  const usageAmount = orderCount * 0.5; // 0.50€ par commande
  const totalAmount = baseAmount + usageAmount;

  return {
    orderCount,
    baseAmount,
    usageAmount,
    totalAmount
  };
};

// Méthodes d'instance
billingSchema.methods.addPayment = async function(payment: {
  amount: number;
  status: 'succeeded' | 'failed' | 'pending';
  stripePaymentIntentId: string;
}) {
  this.paymentHistory.push({
    ...payment,
    date: new Date()
  });
  return this.save();
};

export const Billing: Model<IBilling> = models.Billing || model<IBilling>('Billing', billingSchema);
