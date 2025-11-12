'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, Users, Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';

type ClassroomRow = {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  students: Array<{ _id: string }>;
  createdAt: string;
};

export default function ClassroomsPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadClassrooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/classrooms', { cache: 'no-store' });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Erro ao carregar turmas');
      }

      const data = await response.json();
      setClassrooms(data.classrooms || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao carregar turmas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const handleDelete = async (classroomId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingId(classroomId);
      const response = await fetch(`/api/classrooms/${classroomId}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível excluir a turma');
      }

      toast.success('Turma excluída com sucesso');
      setClassrooms((prev) => prev.filter((item) => item._id !== classroomId));
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao excluir turma');
    } finally {
      setDeletingId(null);
    }
  };

  const totalStudents = useMemo(
    () => classrooms.reduce((sum, classroom) => sum + (classroom.students?.length || 0), 0),
    [classrooms]
  );

  if (isLoading && classrooms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-gray-600">Carregando turmas...</p>
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
              Voltar
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">Minhas turmas</h1>
            <p className="mt-1 text-gray-600">
              Gerencie todas as turmas criadas, copie códigos de convite e edite informações.
            </p>
          </div>

          <Link
            href="/dashboard/classrooms/create"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova turma
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Visão geral</h2>
              <p className="text-sm text-gray-500">
                Você possui {classrooms.length} turma{classrooms.length === 1 ? '' : 's'} cadastrada
                {classrooms.length === 1 ? '' : 's'} com {totalStudents} aluno
                {totalStudents === 1 ? '' : 's'} associado{totalStudents === 1 ? '' : 's'}.
              </p>
            </div>
            <button
              onClick={loadClassrooms}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
            >
              Atualizar lista
            </button>
          </header>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {classrooms.length === 0 ? (
            <div className="text-center py-16">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-600">Nenhuma turma cadastrada ainda.</p>
              <Link
                href="/dashboard/classrooms/create"
                className="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Criar primeira turma
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3">Turma</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Alunos</th>
                    <th className="px-4 py-3">Criada em</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classrooms.map((classroom) => (
                    <tr key={classroom._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{classroom.name}</div>
                        {classroom.description && (
                          <div className="mt-1 text-xs text-gray-500">{classroom.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">{classroom.inviteCode}</td>
                      <td className="px-4 py-3 text-gray-700">{classroom.students?.length || 0}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(classroom.createdAt))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => {
                              navigator.clipboard
                                .writeText(classroom.inviteCode)
                                .then(() => toast.success('Código copiado!'))
                                .catch(() => toast.error('Não foi possível copiar o código'));
                            }}
                            className="text-xs font-medium text-primary-600 hover:underline"
                          >
                            Copiar código
                          </button>
                          <Link
                            href={`/dashboard/classrooms/${classroom._id}/edit`}
                            className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(classroom._id)}
                            disabled={deletingId === classroom._id}
                            className="inline-flex items-center rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === classroom._id ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                            )}
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

