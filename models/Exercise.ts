import mongoose, { Document, Schema } from 'mongoose';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface IExercise extends Document {
  _id: string;
  title: string;
  description: string;
  examples: ITestCase[];
  testCases: ITestCase[];
  timeLimit: number; // em segundos
  memoryLimit: number; // em MB
  tags: string[];
  difficulty: 'facil' | 'medio' | 'dificil';
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>({
  input: {
    type: String,
    required: [true, 'Entrada do teste é obrigatória'],
  },
  expectedOutput: {
    type: String,
    required: [true, 'Saída esperada é obrigatória'],
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
});

const ExerciseSchema = new Schema<IExercise>({
  title: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
  },
  examples: [TestCaseSchema],
  testCases: [TestCaseSchema],
  timeLimit: {
    type: Number,
    required: [true, 'Limite de tempo é obrigatório'],
    default: 2, // 2 segundos
  },
  memoryLimit: {
    type: Number,
    required: [true, 'Limite de memória é obrigatório'],
    default: 128, // 128 MB
  },
  tags: [{
    type: String,
    trim: true,
  }],
  difficulty: {
    type: String,
    enum: ['facil', 'medio', 'dificil'],
    required: [true, 'Dificuldade é obrigatória'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Criador é obrigatório'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
