import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface pour le document User
interface IUser extends Document {
  keycloakId: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les méthodes statiques
interface UserModel extends Model<IUser> {
  findByKeycloakId(keycloakId: string): Promise<IUser | null>;
}

// Définition du schéma
const userSchema = new Schema<IUser>(
  {
    keycloakId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Méthodes statiques
userSchema.statics.findByKeycloakId = function(keycloakId: string) {
  return this.findOne({ keycloakId });
};

// Vérifier si le modèle existe déjà pour éviter l'erreur de recompilation
const User = mongoose.models.User || mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
