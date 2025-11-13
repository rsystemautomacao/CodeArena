'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, BookOpen, Pencil, Trash2, Plus, ArrowLeft, Eye } from 'lucide-react';

type ExerciseRow = {
  _id: string;
  title: string;
  description: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  createdAt: string;
  testCases?: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
};

export default function ExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/exercises?limit=100', { cache: 'no-store' });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Erro ao carregar exercícios');
      }

      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao carregar exercícios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const handleDelete = async (exerciseId: string) => {
    if (!confirm('Tem certeza que deseja excluir este exercício? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeletingId(exerciseId);
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível excluir o exercício');
      }

      toast.success('Exercício excluído com sucesso');
      setExercises((prev) => prev.filter((item) => item._id !== exerciseId));
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao excluir exercício');
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'bg-green-100 text-green-800';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800';
      case 'dificil':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'Fácil';
      case 'medio':
        return 'Médio';
      case 'dificil':
        return 'Difícil';
      default:
        return difficulty;
    }
  };

  if (isLoading && exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-gray-600">Carregando exercícios...</p>
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
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Exercícios</h1>
            <p className="mt-1 text-gray-600">
              Gerencie seus exercícios de programação
            </p>
          </div>
          <Link
            href="/dashboard/exercises/create"
            className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Exercício
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {exercises.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Nenhum exercício criado ainda
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Comece criando seu primeiro exercício de programação
            </p>
            <Link
              href="/dashboard/exercises/create"
              className="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Exercício
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <div
                key={exercise._id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {exercise.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(
                          exercise.difficulty
                        )}`}
                      >
                        {getDifficultyLabel(exercise.difficulty)}
                      </span>
                      {exercise.testCases && (
                        <span className="text-xs text-gray-500">
                          {exercise.testCases.length} caso{exercise.testCases.length !== 1 ? 's' : ''} de teste
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {exercise.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {exercise.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700"
                        >
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-gray-500">
                        {exercise.timeLimit}s • {exercise.memoryLimit}MB
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <Link
                      href={`/dashboard/exercise/${exercise._id}`}
                      className="rounded-md border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/dashboard/exercises/${exercise._id}/edit`}
                      className="rounded-md border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(exercise._id)}
                      disabled={deletingId === exercise._id}
                      className="rounded-md border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      title="Excluir"
                    >
                      {deletingId === exercise._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

