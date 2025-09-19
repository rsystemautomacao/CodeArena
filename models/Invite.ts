import mongoose, { Document, Schema } from 'mongoose';

export interface IInvite extends Document {
  _id: string;
  email: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
}

const InviteSchema = new Schema<IInvite>({
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    lowercase: true,
    trim: true,
  },
  token: {
    type: String,
    required: [true, 'Token é obrigatório'],
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Data de expiração é obrigatória'],
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Índice para expiração automática
InviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);
