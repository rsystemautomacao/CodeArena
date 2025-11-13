import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: 'superadmin' | 'professor' | 'aluno';
  isActive: boolean;
  // Campos adicionais para professor
  phone?: string;
  bio?: string;
  location?: string;
  address?: string;
  subjects?: string[]; // Matérias/disciplinas
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  password: {
    type: String,
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
  avatar: {
    type: String,
  },
  phone: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  subjects: {
    type: [String],
    default: [],
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
