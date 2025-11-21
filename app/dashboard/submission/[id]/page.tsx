'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Edit, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Submission {
  _id: string;
  exercise: {
    _id: string;
    title: string;
  };
  assignment?: {
    _id: string;
    title: string;
  };
  code: string;
  language: string;
  status: 'accepted' | 'compilation_error' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded' | 'pending';
  result?: {
    status: string;
    message: string;
    testCases?: {
      passed: number;
      total: number;
    };
  };
  submittedAt: string;
}

export default function SubmissionResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Contexto para saber de onde veio
  const exerciseId = searchParams.get('exerciseId');
  const assignmentId = searchParams.get('assignmentId');
  const fromActivity = !!assignmentId;

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/submissions?exerciseId=${exerciseId || ''}&limit=100`);
      const data = await response.json();
      
      if (data.submissions) {
        const found = data.submissions.find((s: Submission) => s._id === id);
        if (found) {
          setSubmission(found);
        } else {
          toast.error('Submissão não encontrada');
          router.back();
        }
      }
    } catch (error) {
      console.error('Erro ao buscar submissão:', error);
      toast.error('Erro ao carregar submissão');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Submissão Aceita',
          description: 'Parabéns! Seu código foi aceito e passou em todos os testes.',
        };
      case 'compilation_error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Erro de Compilação',
          description: 'Seu código não compilou. Verifique a sintaxe e tente novamente.',
        };
      case 'wrong_answer':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Resposta Incorreta',
          description: 'Seu código compilou, mas a saída não corresponde ao esperado. Revise sua lógica.',
        };
      case 'runtime_error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Erro de Execução',
          description: 'Seu código compilou, mas ocorreu um erro durante a execução. Verifique sua lógica.',
        };
      case 'time_limit_exceeded':
        return {
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'Tempo Limite Excedido',
          description: 'Seu código excedeu o tempo limite permitido. Considere otimizar sua solução.',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Status Desconhecido',
          description: 'Status da submissão não identificado.',
        };
    }
  };

  const handleEditCode = () => {
    if (submission) {
      router.push(`/dashboard/exercise/${submission.exercise._id}${assignmentId ? `?assignmentId=${assignmentId}` : ''}`);
    }
  };

  const handleNextExercise = () => {
    if (fromActivity && assignmentId) {
      // Se veio de uma atividade, voltar para a lista de atividades
      router.push('/dashboard/assignments');
    } else {
      // Se veio de exercícios públicos, voltar para a lista de exercícios públicos
      router.push('/dashboard/exercises');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando resultado da submissão...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Submissão não encontrada</p>
          <Link href="/dashboard/exercises" className="mt-4 text-primary-600 hover:text-primary-700">
            Voltar para exercícios
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(submission.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Resultado da Submissão</h1>
        </div>

        {/* Status Card */}
        <div className={`rounded-lg border-2 ${statusConfig.borderColor} ${statusConfig.bgColor} p-8 mb-6`}>
          <div className="flex items-start">
            <StatusIcon className={`h-12 w-12 ${statusConfig.color} mr-4 flex-shrink-0`} />
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${statusConfig.color} mb-2`}>
                {statusConfig.title}
              </h2>
              <p className="text-gray-700 mb-4">
                {statusConfig.description}
              </p>
              
              {/* Informações da submissão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Exercício</p>
                  <p className="text-gray-900">{submission.exercise.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Linguagem</p>
                  <p className="text-gray-900 capitalize">{submission.language}</p>
                </div>
                {submission.assignment && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Atividade</p>
                    <p className="text-gray-900">{submission.assignment.title}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Data da Submissão</p>
                  <p className="text-gray-900">
                    {new Date(submission.submittedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Testes passados (apenas se não for aceito) */}
              {submission.result?.testCases && submission.status !== 'accepted' && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">Resultado dos Testes</p>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-gray-900">
                      {submission.result.testCases.passed} de {submission.result.testCases.total} testes passaram
                    </p>
                  </div>
                </div>
              )}

              {/* Testes passados (se aceito) */}
              {submission.result?.testCases && submission.status === 'accepted' && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-600 mb-2">Resultado dos Testes</p>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-green-700 font-medium">
                      ✓ Todos os {submission.result.testCases.total} testes passaram com sucesso!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleEditCode}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Edit className="h-5 w-5 mr-2" />
            Editar Código
          </button>
          <button
            onClick={handleNextExercise}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {fromActivity ? 'Voltar para Atividade' : 'Ver Outros Exercícios'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

