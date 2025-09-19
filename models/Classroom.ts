import mongoose, { Document, Schema } from 'mongoose';

export interface IClassroom extends Document {
  _id: string;
  name: string;
  description?: string;
  professor: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  inviteCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomSchema = new Schema<IClassroom>({
  name: {
    type: String,
    required: [true, 'Nome da turma é obrigatório'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  professor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Professor é obrigatório'],
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  inviteCode: {
    type: String,
    required: [true, 'Código de convite é obrigatório'],
    unique: true,
    uppercase: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Classroom || mongoose.model<IClassroom>('Classroom', ClassroomSchema);
