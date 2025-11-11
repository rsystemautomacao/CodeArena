'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Loader2, Clipboard, RefreshCw, Users } from 'lucide-react';

type Classroom = {
  _id: string;
  name: string;
  description?: string;
  inviteCode: string;
  students: Array<{ _id: string; name: string; email: string }>;
  createdAt: string;
};

export default function CreateClassroomPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const hasClassrooms = useMemo(() => classrooms.length > 0, [classrooms]);

  const loadClassrooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/classrooms', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Não foi possível carregar as turmas');
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error('Informe um nome para a turma');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/classrooms', {
        method: 'POST',
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
        throw new Error(data?.error || 'Não foi possível criar a turma');
      }

      toast.success('Turma criada com sucesso!');
      setName('');
      setDescription('');

      const created = data?.classroom as Classroom | undefined;
      if (created) {
        setClassrooms((prev) => [created, ...prev]);
      } else {
        loadClassrooms();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao criar turma');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Código ${code} copiado!`);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível copiar o código');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova turma</h1>
            <p className="mt-1 text-gray-600">
              Gere códigos de convite e acompanhe todos os alunos em um único lugar.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:text-primary-600"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header>
            <h2 className="text-xl font-semibold text-gray-900">Informações da turma</h2>
            <p className="mt-1 text-sm text-gray-500">
              Informe os detalhes da turma que será disponibilizada para os alunos.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome da turma
              </label>
              <input
                id="name"
                type="text"
                placeholder="Ex.: Estruturas de Dados - Turma A"
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
                placeholder="Objetivo, conteúdo programático, horários, etc."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="font-medium text-gray-700">Dica rápida</p>
              <p className="mt-1">
                O código de convite será gerado automaticamente e pode ser compartilhado com os
                alunos. Eles só precisarão inseri-lo uma vez para ingressar na turma.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando turma...
                </>
              ) : (
                'Criar turma'
              )}
            </button>
          </form>
        </section>

        <aside className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Suas turmas</h2>
              <p className="text-sm text-gray-500">
                {hasClassrooms ? 'Gerencie e compartilhe os códigos abaixo.' : 'Nenhuma turma criada ainda.'}
              </p>
            </div>
            <button
              onClick={loadClassrooms}
              className="rounded-md border border-gray-200 p-2 text-gray-500 transition hover:border-primary-200 hover:text-primary-600"
              title="Atualizar lista"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando turmas...
            </div>
          ) : hasClassrooms ? (
            <ul className="space-y-4">
              {classrooms.map((classroom) => (
                <li
                  key={classroom._id}
                  className="rounded-xl border border-gray-200 p-4 transition hover:border-primary-200 hover:bg-primary-50/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{classroom.name}</h3>
                      {classroom.description && (
                        <p className="mt-1 text-sm text-gray-500">{classroom.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center rounded-lg bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700">
                        <Users className="mr-1 h-3 w-3" />
                        {classroom.students?.length || 0} alunos
                      </div>
                      <button
                        onClick={() => copyInviteCode(classroom.inviteCode)}
                        className="rounded-md border border-primary-200 px-3 py-1 text-xs font-semibold uppercase text-primary-700 transition hover:bg-primary-600 hover:text-white"
                      >
                        {classroom.inviteCode}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Ao criar uma turma, ela aparecerá aqui com o código de convite para compartilhar com os alunos.
            </div>
          )}
        </aside>
      </div>

      <div className="mx-auto max-w-5xl pb-10 px-6">
        <div className="rounded-2xl bg-primary-50 p-6 text-sm text-primary-800">
          <p className="font-semibold text-primary-900">Como os convites funcionam?</p>
          <ul className="mt-3 space-y-2">
            <li>• Compartilhe o código gerado com seus alunos.</li>
            <li>• Eles acessam o painel do aluno e inserem o código uma única vez.</li>
            <li>• Você pode desativar a turma ou remover alunos diretamente pelo painel do professor.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

