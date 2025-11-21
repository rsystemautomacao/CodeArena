'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Clock, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface Classroom {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  professor: {
    _id: string;
    name: string;
    email: string;
  };
  students: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
}

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  type: 'lista' | 'prova';
  startDate: string;
  endDate: string;
  exercises: Array<{ _id: string; title: string }>;
  createdAt: string;
}

export default function ClassroomDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isStudent = session?.user?.role === 'aluno';

  useEffect(() => {
    if (id) {
      fetchClassroom();
      fetchAssignments();
    }
  }, [id]);

  const fetchClassroom = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/classrooms/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Erro ao carregar turma');
      }

      const data = await response.json();
      setClassroom(data.classroom);
    } catch (error: any) {
      console.error('Erro ao carregar turma:', error);
      toast.error(error?.message || 'Erro ao carregar turma');
      router.push('/dashboard/classrooms');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?classroomId=${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    }
  };

  const getActiveAssignments = () => {
    const now = new Date();
    return assignments.filter(a => {
      const start = new Date(a.startDate);
      const end = new Date(a.endDate);
      return start <= now && end >= now;
    });
  };

  const getClosedAssignments = () => {
    const now = new Date();
    return assignments.filter(a => {
      const end = new Date(a.endDate);
      return end < now;
    });
  };

  const getUpcomingAssignments = () => {
    const now = new Date();
    return assignments.filter(a => {
      const start = new Date(a.startDate);
      return start > now;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados da turma...</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Turma não encontrada</p>
          <Link href="/dashboard/classrooms" className="mt-4 text-primary-600 hover:text-primary-700">
            Voltar para turmas
          </Link>
        </div>
      </div>
    );
  }

  const activeAssignments = getActiveAssignments();
  const closedAssignments = getClosedAssignments();
  const upcomingAssignments = getUpcomingAssignments();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={isStudent ? "/dashboard/classrooms" : "/dashboard/classrooms"}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
          {classroom.description && (
            <p className="text-gray-600 mt-2">{classroom.description}</p>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Professor Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-primary-100 rounded-lg mr-4">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Professor</p>
                <p className="text-lg font-semibold text-gray-900">{classroom.professor.name}</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span>{classroom.professor.email}</span>
            </div>
          </div>

          {/* Students Count */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Alunos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {classroom.students?.length || 0}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Matriculados na turma</p>
          </div>

          {/* Assignments Count */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Atividades</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {activeAssignments.length} ativas, {closedAssignments.length} encerradas
            </p>
          </div>
        </div>

        {/* Active Assignments */}
        {activeAssignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Atividades em Aberto</h2>
            </div>
            <div className="space-y-4">
              {activeAssignments.map((assignment) => (
                <Link
                  key={assignment._id}
                  href={`/dashboard/assignments/${assignment._id}`}
                  className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            Até {new Date(assignment.endDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          <span>{assignment.exercises.length} exercícios</span>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {assignment.type === 'lista' ? 'Lista' : 'Prova'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Assignments */}
        {upcomingAssignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4">
              <Clock className="w-6 h-6 text-yellow-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Atividades Futuras</h2>
            </div>
            <div className="space-y-4">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            Inicia em {new Date(assignment.startDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          <span>{assignment.exercises.length} exercícios</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Closed Assignments */}
        {closedAssignments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4">
              <XCircle className="w-6 h-6 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Atividades Encerradas</h2>
            </div>
            <div className="space-y-4">
              {closedAssignments.map((assignment) => (
                <Link
                  key={assignment._id}
                  href={`/dashboard/assignments/${assignment._id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            Encerrada em {new Date(assignment.endDate).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          <span>{assignment.exercises.length} exercícios</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {assignments.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma atividade encontrada
            </h2>
            <p className="text-gray-600">
              Esta turma ainda não possui atividades cadastradas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

