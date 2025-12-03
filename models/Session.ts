import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  sessionToken: string; // Token da sessão do NextAuth
  ipAddress?: string; // IP do cliente
  userAgent?: string; // User agent do navegador
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório'],
    index: true,
  },
  sessionToken: {
    type: String,
    required: [true, 'Token da sessão é obrigatório'],
    unique: true,
    index: true,
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Índice composto para buscar sessões ativas de um usuário
SessionSchema.index({ userId: 1, isActive: 1 });

// Remover sessões antigas automaticamente (opcional - pode ser feito via job)
SessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 * 7 }); // 7 dias

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

