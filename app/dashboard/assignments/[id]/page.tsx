'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Lock, 
  Globe,
  Loader2,
  ArrowLeft
} from 'lucide-react';

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  type: 'lista' | 'prova';
  startDate: string;
  endDate: string;
  timeLimit?: number;
  exercises: Array<{ _id: string; title: string }>;
  classroom: { _id: string; name: string };
}

interface AccessStatus {
  hasAccess: boolean;
  isProva: boolean;
  isEnabled: boolean;
  ipValid: boolean;
  clientIP: string;
  enabledMessage?: string;
  ipMessage?: string;
  requireLabIP: boolean;
  allowedIPRanges: string[];
}

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isStudent = session?.user?.role === 'aluno';

  useEffect(() => {
    if (id) {
      fetchAssignment();
      if (isStudent) {
        checkAccess();
      }
    }
  }, [id, isStudent]);

  const fetchAssignment = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/assignments?classroomId=all`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar atividade');
      }

      const data = await response.json();
      const found = data.assignments?.find((a: Assignment) => a._id === id);
      
      if (!found) {
        throw new Error('Atividade não encontrada');
      }

      setAssignment(found);
    } catch (error: any) {
      console.error('Erro ao carregar atividade:', error);
      toast.error(error?.message || 'Erro ao carregar atividade');
      router.push('/dashboard/assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccess = async () => {
    try {
      const response = await fetch(`/api/assignments/${id}/check-access`);
      
      if (response.ok) {
        const data = await response.json();
        setAccessStatus(data);
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
    }
  };

  const isActive = () => {
    if (!assignment) return false;
    const now = new Date();
    const start = new Date(assignment.startDate);
    const end = new Date(assignment.endDate);
    return now >= start && now <= end;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-gray-600">Carregando atividade...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Atividade não encontrada
          </h1>
          <Link
            href="/dashboard/assignments"
            className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const active = isActive();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title={assignment.title} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard/assignments"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para atividades
        </Link>

        {/* Status de Acesso para Provas (Alunos) */}
        {isStudent && assignment.type === 'prova' && accessStatus && (
          <div className={`mb-6 rounded-lg border p-4 ${
            accessStatus.hasAccess 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              {accessStatus.hasAccess ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${
                  accessStatus.hasAccess ? 'text-green-900' : 'text-red-900'
                }`}>
                  {accessStatus.hasAccess 
                    ? 'Acesso Permitido' 
                    : 'Acesso Negado'}
                </h3>
                
                {!accessStatus.isEnabled && accessStatus.enabledMessage && (
                  <div className="mb-2">
                    <p className="text-sm text-red-700 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      {accessStatus.enabledMessage}
                    </p>
                  </div>
                )}
                
                {!accessStatus.ipValid && accessStatus.ipMessage && (
                  <div className="mb-2">
                    <p className="text-sm text-red-700 flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      {accessStatus.ipMessage}
                    </p>
                  </div>
                )}
                
                {accessStatus.ipValid && accessStatus.ipMessage && (
                  <p className="text-sm text-green-700 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    {accessStatus.ipMessage}
                  </p>
                )}
                
                <p className="text-xs text-gray-600 mt-2">
                  Seu IP: {accessStatus.clientIP || 'Não detectado'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informações da Atividade */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{assignment.title}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              assignment.type === 'prova'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {assignment.type === 'prova' ? 'Prova' : 'Lista'}
            </span>
          </div>

          {assignment.description && (
            <p className="text-gray-700 mb-4">{assignment.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>
                Início: {new Date(assignment.startDate).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>
                Término: {new Date(assignment.endDate).toLocaleString('pt-BR')}
              </span>
            </div>
            {assignment.timeLimit && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>Limite de tempo: {assignment.timeLimit} minutos</span>
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <span>{assignment.exercises.length} exercício(s)</span>
            </div>
          </div>
        </div>

        {/* Lista de Exercícios */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Exercícios
          </h3>
          
          {assignment.exercises.length === 0 ? (
            <p className="text-gray-600">Nenhum exercício nesta atividade.</p>
          ) : (
            <div className="space-y-2">
              {assignment.exercises.map((exercise, index) => (
                <Link
                  key={exercise._id}
                  href={`/dashboard/exercise/${exercise._id}?assignmentId=${assignment._id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900">
                        {index + 1}. {exercise.title}
                      </span>
                    </div>
                    {isStudent && active && (
                      <span className="text-sm text-primary-600 hover:text-primary-700">
                        Resolver →
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Aviso se não estiver ativa */}
        {!active && isStudent && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Esta atividade ainda não está disponível ou já foi encerrada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

