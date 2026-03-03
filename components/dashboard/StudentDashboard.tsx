'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  BookOpen,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import StudentSidebar from './StudentSidebar';

interface Classroom {
  _id: string;
  name: string;
  description?: string;
  professor: { name: string };
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
  exercise: { _id?: string; title: string };
  status: string;
  submittedAt: string;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.id && session?.user?.role) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const classroomsRes = await fetch('/api/classrooms');
      if (classroomsRes.ok) {
        const data = await classroomsRes.json();
        setClassrooms(data.classrooms || []);
      }

      const assignmentsRes = await fetch('/api/assignments');
      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        const now = new Date();
        const active = (data.assignments || []).filter((a: Assignment) => {
          const start = new Date(a.startDate);
          const end = new Date(a.endDate);
          return start <= now && end >= now;
        });
        setAssignments(active);
      }

      const submissionsRes = await fetch('/api/submissions?limit=5');
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setRecentSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
      const response = await fetch('/api/classrooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Erro ao entrar na turma');
        return;
      }
      toast.success(data.message || 'Entrou na turma com sucesso!');
      setInviteCode('');
      await fetchData();
    } catch (error) {
      toast.error('Erro ao entrar na turma');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-500/20';
      case 'wrong_answer': return 'text-red-700 bg-red-50 ring-1 ring-red-500/20';
      case 'time_limit_exceeded': return 'text-amber-700 bg-amber-50 ring-1 ring-amber-500/20';
      case 'runtime_error': return 'text-orange-700 bg-orange-50 ring-1 ring-orange-500/20';
      case 'compilation_error': return 'text-purple-700 bg-purple-50 ring-1 ring-purple-500/20';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Aceito';
      case 'wrong_answer': return 'Resposta Incorreta';
      case 'time_limit_exceeded': return 'Tempo Excedido';
      case 'runtime_error': return 'Erro de Execução';
      case 'compilation_error': return 'Erro de Compilação';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 lg:pl-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={session?.user?.name}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
              </div>
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                Aluno
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Olá, {session?.user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-gray-500 text-sm">
              Acompanhe suas atividades e progresso de programação
            </p>
          </div>

          {/* Join Classroom */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-emerald-600" />
              <h2 className="font-semibold text-gray-900 text-sm">Entrar em uma Turma</h2>
            </div>
            <form onSubmit={handleJoinClassroom} className="flex gap-3">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                placeholder="Digite o código da turma"
                required
              />
              <button
                type="submit"
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Entrar
              </button>
            </form>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link
              href="/dashboard/classrooms/student"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{classrooms.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Turmas</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/assignments"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Atividades Ativas</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/submissions"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {recentSubmissions.filter((s) => s.status === 'accepted').length}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Resolvidos</p>
                </div>
              </div>
            </Link>

            <div className="bg-white p-5 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-xs text-gray-500 font-medium">Ranking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Assignments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Atividades Ativas</h3>
                <Link
                  href="/dashboard/assignments"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Ver todas →
                </Link>
              </div>

              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhuma atividade ativa no momento</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Entre em uma turma para ver atividades
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.slice(0, 5).map((assignment) => (
                    <Link
                      key={assignment._id}
                      href={`/dashboard/assignments/${assignment._id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{assignment.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {assignment.classroom.name} · {assignment.exercises.length} exercícios
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            assignment.type === 'prova'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {assignment.type === 'prova' ? 'Prova' : 'Lista'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Submissões Recentes</h3>
                <Link
                  href="/dashboard/submissions"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Ver todas →
                </Link>
              </div>

              {recentSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhuma submissão ainda</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Resolva exercícios para ver seu histórico
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSubmissions.slice(0, 5).map((submission) => (
                    <Link
                      key={submission._id}
                      href={`/dashboard/submission/${submission._id}?exerciseId=${submission.exercise._id || ''}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {submission.exercise.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(submission.submittedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}
                      >
                        {getStatusText(submission.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* My Classrooms */}
          {classrooms.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Minhas Turmas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classrooms.map((classroom) => (
                  <Link
                    key={classroom._id}
                    href={`/dashboard/classrooms/${classroom._id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{classroom.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">Prof. {classroom.professor.name}</p>
                    {classroom.description && (
                      <p className="text-xs text-gray-400 line-clamp-2">{classroom.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
