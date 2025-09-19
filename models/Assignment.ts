import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  _id: string;
  title: string;
  description?: string;
  exercises: mongoose.Types.ObjectId[];
  classroom: mongoose.Types.ObjectId;
  type: 'lista' | 'prova';
  startDate: Date;
  endDate: Date;
  timeLimit?: number; // em minutos, para provas
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  exercises: [{
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  }],
  classroom: {
    type: Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Turma é obrigatória'],
  },
  type: {
    type: String,
    enum: ['lista', 'prova'],
    required: [true, 'Tipo é obrigatório'],
  },
  startDate: {
    type: Date,
    required: [true, 'Data de início é obrigatória'],
  },
  endDate: {
    type: Date,
    required: [true, 'Data de fim é obrigatória'],
  },
  timeLimit: {
    type: Number, // em minutos
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Criador é obrigatório'],
  },
}, {
  timestamps: true,
});

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
