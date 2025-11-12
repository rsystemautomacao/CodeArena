'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Loader2, Users } from 'lucide-react';

type ClassroomDetail = {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  students: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
};

export default function EditClassroomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const classroomId = params?.id;

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadClassroom = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/classrooms/${classroomId}`, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível carregar a turma');
      }

      setClassroom(data.classroom);
      setName(data.classroom.name || '');
      setDescription(data.classroom.description || '');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao carregar turma');
      router.push('/dashboard/classrooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (classroomId) {
      loadClassroom();
    }
  }, [classroomId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Informe um nome para a turma');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/classrooms/${classroomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível atualizar a turma');
      }

      toast.success('Turma atualizada com sucesso!');
      router.push('/dashboard/classrooms');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao salvar turma');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-gray-600">Carregando turma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <Link
              href="/dashboard/classrooms"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">Editar turma</h1>
            <p className="mt-1 text-gray-600">
              Atualize o nome, descrição e visualize o código de convite desta turma.
            </p>
          </div>
          <div className="rounded-lg bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700">
            Código: <span className="font-mono">{classroom.inviteCode}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header>
            <h2 className="text-lg font-semibold text-gray-900">Informações da turma</h2>
            <p className="text-sm text-gray-500">
              Estas informações serão exibidas para os alunos que ingressarem com o código.
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome da turma
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição (opcional)
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-400"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </button>
          </form>
        </section>

        <aside className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-primary-50 p-5 text-sm text-primary-800">
            <div className="flex items-center space-x-2 font-semibold text-primary-900">
              <Users className="h-4 w-4" />
              <span>Alunos matriculados</span>
            </div>
            {classroom.students?.length ? (
              <ul className="mt-4 space-y-3 text-sm text-primary-900">
                {classroom.students.map((student) => (
                  <li key={student._id} className="rounded-lg bg-white px-3 py-2 text-primary-800">
                    {student.name} <span className="text-xs text-primary-600">({student.email})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-primary-700">
                Nenhum aluno ingressou nesta turma ainda. Compartilhe o código para convidá-los.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Compartilhe o código</p>
            <p className="mt-2">
              Seus alunos acessam o painel do aluno e utilizam o código{' '}
              <span className="font-mono font-semibold">{classroom.inviteCode}</span> para ingressar.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

