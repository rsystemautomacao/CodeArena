import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: 'superadmin' | 'professor' | 'aluno';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ['superadmin', 'professor', 'aluno'],
    required: [true, 'Papel do usuário é obrigatório'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
