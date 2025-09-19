'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  BookOpen, 
  Users, 
  Plus, 
  LogOut, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Aqui você faria as chamadas para a API para buscar turmas e atividades
      // Por enquanto, vamos usar dados mockados
      setClassrooms([]);
      setAssignments([]);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
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
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Professor
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
            Painel do Professor
          </h1>
          <p className="text-gray-600">
            Gerencie suas turmas, exercícios e acompanhe o progresso dos alunos
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/dashboard/classrooms/create"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-primary-500 group"
          >
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <Plus className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nova Turma
              </h3>
              <p className="text-gray-600 text-sm">
                Crie uma nova turma e gere código de convite para alunos
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/exercises/create"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-primary-500 group"
          >
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-success-200 transition-colors">
                <BookOpen className="w-6 h-6 text-success-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Novo Exercício
              </h3>
              <p className="text-gray-600 text-sm">
                Crie exercícios de programação com casos de teste
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/assignments/create"
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-primary-500 group"
          >
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition-colors">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nova Atividade
              </h3>
              <p className="text-gray-600 text-sm">
                Crie listas de exercícios ou provas para suas turmas
              </p>
            </div>
          </Link>
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
                <p className="text-sm font-medium text-gray-600">Exercícios</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atividades Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Classrooms */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Turmas Recentes
              </h2>
              <Link
                href="/dashboard/classrooms"
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                Ver todas
              </Link>
            </div>
            
            {classrooms.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhuma turma criada ainda</p>
                <Link
                  href="/dashboard/classrooms/create"
                  className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
                >
                  Criar Primeira Turma
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {classrooms.slice(0, 3).map((classroom) => (
                  <div key={classroom._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{classroom.name}</h3>
                      <p className="text-sm text-gray-600">
                        {classroom.students.length} alunos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Código</p>
                      <p className="font-mono text-sm font-medium">{classroom.inviteCode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Assignments */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Atividades Recentes
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
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Nenhuma atividade criada ainda</p>
                <Link
                  href="/dashboard/assignments/create"
                  className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
                >
                  Criar Primeira Atividade
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 3).map((assignment) => (
                  <div key={assignment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
