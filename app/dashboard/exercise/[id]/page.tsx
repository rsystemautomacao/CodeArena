'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import CodeEditor from '@/components/CodeEditor';
import { 
  BookOpen, 
  Clock, 
  Cpu, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Exercise {
  _id: string;
  title: string;
  description: string;
  examples: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  timeLimit: number;
  memoryLimit: number;
  difficulty: 'facil' | 'medio' | 'dificil';
  tags: string[];
}

interface Submission {
  _id: string;
  status: string;
  result?: {
    status: string;
    message: string;
    testCases: {
      passed: number;
      total: number;
    };
  };
  submittedAt: string;
}

export default function ExercisePage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExercise = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/exercises/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Erro ao carregar exercício');
      }

      const data = await response.json();
      
      if (data.exercise) {
        // Converter testCases para examples se necessário
        const exerciseData = {
          ...data.exercise,
          examples: data.exercise.examples || [],
        };
        setExercise(exerciseData);
      } else {
        throw new Error('Exercício não encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao carregar exercício:', error);
      toast.error(error?.message || 'Erro ao carregar exercício');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchSubmissions = useCallback(async () => {
    try {
      const response = await fetch(`/api/submissions?exerciseId=${id}`);
      const data = await response.json();
      
      if (data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Erro ao carregar submissões:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchExercise();
      fetchSubmissions();
    }
  }, [id, fetchExercise, fetchSubmissions]);

  const handleCodeSubmit = () => {
    // Recarregar submissões após submissão
    fetchSubmissions();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'bg-green-100 text-green-800';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800';
      case 'dificil':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'Fácil';
      case 'medio':
        return 'Médio';
      case 'dificil':
        return 'Difícil';
      default:
        return difficulty;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'wrong_answer':
        return 'text-red-600 bg-red-100';
      case 'time_limit_exceeded':
        return 'text-yellow-600 bg-yellow-100';
      case 'runtime_error':
        return 'text-orange-600 bg-orange-100';
      case 'compilation_error':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Aceito';
      case 'wrong_answer':
        return 'Resposta Incorreta';
      case 'time_limit_exceeded':
        return 'Tempo Excedido';
      case 'runtime_error':
        return 'Erro de Execução';
      case 'compilation_error':
        return 'Erro de Compilação';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando exercício...</p>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Exercício não encontrado
          </h1>
          <p className="text-gray-600 mb-4">
            O exercício que você está procurando não existe ou foi removido.
          </p>
          <Link
            href="/dashboard"
            className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-primary-500">CodeArena</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Exercise Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {exercise.title}
                </h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
                  {getDifficultyText(exercise.difficulty)}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Limite de tempo: {exercise.timeLimit}s
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Cpu className="w-4 h-4 mr-2" />
                  Limite de memória: {exercise.memoryLimit}MB
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Examples */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Exemplos</h3>
                <div className="space-y-3">
                  {exercise.examples.map((example, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Entrada:</p>
                        <pre className="text-sm font-mono bg-white p-2 rounded border">
                          {example.input}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Saída:</p>
                        <pre className="text-sm font-mono bg-white p-2 rounded border">
                          {example.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Descrição</h3>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700">
                  {exercise.description}
                </pre>
              </div>
            </div>

            {/* Code Editor */}
            <div className="mb-6">
              <CodeEditor
                exerciseId={exercise._id}
                language="python"
                initialCode={undefined}
                onSubmit={handleCodeSubmit}
              />
            </div>

            {/* Submissions History */}
            {submissions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-medium text-gray-900 mb-4">Histórico de Submissões</h3>
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((submission) => (
                    <div key={submission._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">
                          {new Date(submission.submittedAt).toLocaleString('pt-BR')}
                        </p>
                        {submission.result?.testCases && (
                          <p className="text-xs text-gray-500">
                            {submission.result.testCases.passed}/{submission.result.testCases.total} testes passaram
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                          {getStatusText(submission.status)}
                        </span>
                        {submission.result?.message && (
                          <p className="text-xs text-gray-500 mt-1">
                            {submission.result.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
