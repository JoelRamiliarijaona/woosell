import mongoose, { type InferSchemaType, type Types } from 'mongoose';

const siteSchema = new mongoose.Schema(
  {
    storeId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['shop'],
      default: 'shop',
      required: true,
    },
    apiHost: {
      type: String,
      required: true,
    },
    apiKey: {
      type: String,
      required: true,
    },
    apiSecret: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: ['woo'],
      default: 'woo',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'error'],
      default: 'pending',
    },
    stats: {
      orderCount: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      lastSync: { type: Date },
    }
  },
  { timestamps: true },
);

export type SiteType = InferSchemaType<typeof siteSchema> & {
  _id: Types.ObjectId;
};

// Vérifier si le modèle existe déjà avant de le créer
export const SiteModel = mongoose.models.sites || mongoose.model<SiteType>('sites', siteSchema);
