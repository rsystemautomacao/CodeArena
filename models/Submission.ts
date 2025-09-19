import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionStatus = 
  | 'accepted' 
  | 'wrong_answer' 
  | 'time_limit_exceeded' 
  | 'runtime_error' 
  | 'compilation_error'
  | 'memory_limit_exceeded'
  | 'pending'
  | 'processing';

export interface ISubmission extends Document {
  _id: string;
  user: mongoose.Types.ObjectId;
  exercise: mongoose.Types.ObjectId;
  assignment?: mongoose.Types.ObjectId;
  code: string;
  language: string;
  status: SubmissionStatus;
  result?: {
    status: SubmissionStatus;
    message: string;
    time?: number;
    memory?: number;
    testCases?: {
      passed: number;
      total: number;
    };
  };
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório'],
  },
  exercise: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: [true, 'Exercício é obrigatório'],
  },
  assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
  },
  code: {
    type: String,
    required: [true, 'Código é obrigatório'],
  },
  language: {
    type: String,
    required: [true, 'Linguagem é obrigatória'],
  },
  status: {
    type: String,
    enum: [
      'accepted',
      'wrong_answer',
      'time_limit_exceeded',
      'runtime_error',
      'compilation_error',
      'memory_limit_exceeded',
      'pending',
      'processing'
    ],
    default: 'pending',
  },
  result: {
    status: {
      type: String,
      enum: [
        'accepted',
        'wrong_answer',
        'time_limit_exceeded',
        'runtime_error',
        'compilation_error',
        'memory_limit_exceeded'
      ],
    },
    message: String,
    time: Number,
    memory: Number,
    testCases: {
      passed: Number,
      total: Number,
    },
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
