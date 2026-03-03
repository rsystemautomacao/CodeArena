'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  BookOpen,
  Users,
  Plus,
  BarChart3,
  Clock,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';

interface Classroom {
  _id: string;
  name: string;
  description?: string;
  students: any[];
  inviteCode: string;
  createdAt: string;
}

interface Assignment {
  _id: string;
  title: string;
  type: 'lista' | 'prova';
  startDate: string;
  endDate: string;
  exercises: any[];
  classroom: Classroom;
}

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exercisesCount, setExercisesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalStudents = classrooms.reduce(
    (total, classroom) => total + (classroom.students?.length || 0),
    0
  );
  const recentClassrooms = classrooms.slice(0, 3);

  useEffect(() => {
    if (session?.user?.id && session?.user?.role) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const [classroomRes, assignmentRes, exercisesRes] = await Promise.all([
        fetch('/api/classrooms', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/assignments', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/exercises?limit=1', { cache: 'no-store', credentials: 'include' }),
      ]);

      if (classroomRes.ok) {
        const data = await classroomRes.json();
        setClassrooms(data.classrooms || []);
      } else {
        const payload = await classroomRes.json().catch(() => null);
        toast.error(payload?.error || 'Erro ao carregar turmas');
      }

      if (assignmentRes.ok) {
        const data = await assignmentRes.json();
        setAssignments(data.assignments || []);
      } else {
        const payload = await assignmentRes.json().catch(() => null);
        toast.error(payload?.error || 'Erro ao carregar atividades');
      }

      if (exercisesRes.ok) {
        const data = await exercisesRes.json();
        setExercisesCount(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 lg:pl-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
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
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20">
                Professor
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
              Aqui está um resumo das suas turmas e atividades
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              href="/dashboard/classrooms/create"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Nova Turma</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Crie e convide alunos</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/exercises/create"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Novo Exercício</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Com casos de teste</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/assignments/create"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Nova Atividade</h3>
                  <p className="text-gray-500 text-xs mt-0.5">Lista ou prova</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link
              href="/dashboard/classrooms"
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
              href="/dashboard/exercises"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{exercisesCount}</p>
                  <p className="text-xs text-gray-500 font-medium">Exercícios</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/assignments"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Atividades</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/students"
              className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-xs text-gray-500 font-medium">Alunos</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Classrooms */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Turmas Recentes</h3>
                <Link
                  href="/dashboard/classrooms"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Ver todas →
                </Link>
              </div>

              {recentClassrooms.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">Nenhuma turma criada ainda</p>
                  <Link
                    href="/dashboard/classrooms/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Criar Primeira Turma
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentClassrooms.map((classroom) => (
                    <div
                      key={classroom._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{classroom.name}</h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          {classroom.inviteCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                          {classroom.students?.length || 0} alunos
                        </span>
                        <Link
                          href={`/dashboard/classrooms/${classroom._id}/edit`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Gerenciar
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Assignments */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Atividades Recentes</h3>
                <Link
                  href="/dashboard/assignments"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Ver todas →
                </Link>
              </div>

              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-4">Nenhuma atividade criada ainda</p>
                  <Link
                    href="/dashboard/assignments/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Criar Primeira Atividade
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.slice(0, 3).map((assignment) => (
                    <div
                      key={assignment._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
