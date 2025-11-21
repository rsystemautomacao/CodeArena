'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Loader2, Clock, Pencil, Trash2, Plus, Users } from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';

type AssignmentRow = {
  _id: string;
  title: string;
  description?: string;
  type: 'lista' | 'prova';
  startDate: string;
  endDate: string;
  timeLimit?: number;
  exercises: Array<{ _id: string; title: string }>;
  classroom: { _id: string; name: string; inviteCode: string };
  createdAt: string;
};

export default function AssignmentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isStudent = session?.user?.role === 'aluno';

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/assignments', { cache: 'no-store' });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Erro ao carregar atividades');
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao carregar atividades');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingId(assignmentId);
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível excluir a atividade');
      }

      toast.success('Atividade excluída com sucesso');
      setAssignments((prev) => prev.filter((item) => item._id !== assignmentId));
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao excluir atividade');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const isUpcoming = (startDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    return now < start;
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-gray-600">Carregando atividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {isStudent ? 'Minhas Atividades' : 'Atividades'}
            </h1>
            <p className="mt-1 text-gray-600">
              {isStudent 
                ? 'Visualize e responda às atividades disponíveis' 
                : 'Gerencie suas listas e provas'}
            </p>
          </div>
          {!isStudent && (
            <Link
              href="/dashboard/assignments/create"
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Atividade
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {assignments.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              {isStudent ? 'Nenhuma atividade disponível' : 'Nenhuma atividade criada ainda'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {isStudent 
                ? 'Aguarde professores publicarem atividades' 
                : 'Comece criando sua primeira lista ou prova'}
            </p>
            {!isStudent && (
              <Link
                href="/dashboard/assignments/create"
                className="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Atividade
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const active = isActive(assignment.startDate, assignment.endDate);
              const upcoming = isUpcoming(assignment.startDate);
              
              return (
                <div
                  key={assignment._id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            assignment.type === 'prova'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {assignment.type === 'prova' ? 'Prova' : 'Lista'}
                        </span>
                        {active && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            Ativa
                          </span>
                        )}
                        {upcoming && (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                            Em breve
                          </span>
                        )}
                      </div>
                      {assignment.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{assignment.classroom.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                          </span>
                        </div>
                        <span>
                          {assignment.exercises.length} exercício{assignment.exercises.length !== 1 ? 's' : ''}
                        </span>
                        {assignment.timeLimit && (
                          <span>
                            Limite: {assignment.timeLimit} min
                          </span>
                        )}
                      </div>
                    </div>
                    {!isStudent && (
                      <div className="ml-4 flex items-center space-x-2">
                        <Link
                          href={`/dashboard/assignments/${assignment._id}/edit`}
                          className="rounded-md border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(assignment._id)}
                          disabled={deletingId === assignment._id}
                          className="rounded-md border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          title="Excluir"
                        >
                          {deletingId === assignment._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                    {isStudent && active && (
                      <Link
                        href={`/dashboard/assignments/${assignment._id}`}
                        className="ml-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                      >
                        Responder
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

