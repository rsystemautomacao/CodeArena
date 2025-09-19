'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  BookOpen, 
  Users, 
  LogOut, 
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface Classroom {
  _id: string;
  name: string;
  description?: string;
  professor: {
    name: string;
  };
  inviteCode: string;
}

interface Assignment {
  _id: string;
  title: string;
  type: 'lista' | 'prova';
  startDate: string;
  endDate: string;
  exercises: any[];
  classroom: Classroom;
  timeLimit?: number;
}

interface Submission {
  _id: string;
  exercise: {
    title: string;
  };
  status: string;
  submittedAt: string;
  result?: {
    status: string;
    message: string;
  };
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Aqui você faria as chamadas para a API para buscar dados do aluno
      // Por enquanto, vamos usar dados mockados
      setClassrooms([]);
      setAssignments([]);
      setRecentSubmissions([]);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) {
      toast.error('Por favor, insira o código da turma');
      return;
    }

    try {
      // Aqui você faria a chamada para a API para entrar na turma
      toast.success('Entrou na turma com sucesso!');
      setInviteCode('');
      fetchData(); // Recarregar dados
    } catch (error) {
      toast.error('Erro ao entrar na turma');
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
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
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-500">CodeArena</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Aluno
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Olá, <span className="font-medium">{session?.user?.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meu Dashboard
          </h1>
          <p className="text-gray-600">
            Acompanhe suas atividades, turmas e progresso de programação
          </p>
        </div>

        {/* Join Classroom Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Plus className="w-5 h-5 text-primary-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Entrar em uma Turma
            </h2>
          </div>
          
          <form onSubmit={handleJoinClassroom} className="flex gap-4">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              placeholder="Digite o código da turma"
              required
            />
            <button
              type="submit"
              className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Turmas</p>
                <p className="text-2xl font-bold text-gray-900">{classrooms.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-success-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atividades Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Exercícios Resolvidos</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Posição no Ranking</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Assignments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Atividades Ativas
              </h2>
              <Link
                href="/dashboard/assignments"
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Ver todas
              </Link>
            </div>
            
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhuma atividade ativa no momento</p>
                <p className="text-sm text-gray-500">
                  Entre em uma turma para ver as atividades disponíveis
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 5).map((assignment) => (
                  <Link
                    key={assignment._id}
                    href={`/dashboard/assignments/${assignment._id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-600">
                          {assignment.classroom.name} • {assignment.exercises.length} exercícios
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          assignment.type === 'prova' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {assignment.type === 'prova' ? 'Prova' : 'Lista'}
                        </span>
                        {assignment.timeLimit && (
                          <p className="text-xs text-gray-500 mt-1">
                            {assignment.timeLimit} min
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Submissões Recentes
              </h2>
              <Link
                href="/dashboard/submissions"
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Ver todas
              </Link>
            </div>
            
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhuma submissão ainda</p>
                <p className="text-sm text-gray-500">
                  Comece resolvendo exercícios para ver seu histórico
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.slice(0, 5).map((submission) => (
                  <div key={submission._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{submission.exercise.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(submission.submittedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                        {getStatusText(submission.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Classrooms */}
        {classrooms.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Minhas Turmas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.map((classroom) => (
                <Link
                  key={classroom._id}
                  href={`/dashboard/classrooms/${classroom._id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">{classroom.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Prof. {classroom.professor.name}
                  </p>
                  {classroom.description && (
                    <p className="text-sm text-gray-500">{classroom.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
