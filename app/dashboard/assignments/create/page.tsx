'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, CalendarDays, Clock3, ListChecks, Users, CheckSquare, Square } from 'lucide-react';

type ClassroomOption = {
  _id: string;
  name: string;
  inviteCode: string;
};

type ExerciseOption = {
  _id: string;
  title: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  tags?: string[];
  createdAt: string;
};

const difficultyLabel: Record<ExerciseOption['difficulty'], string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

export default function CreateAssignmentPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [assignmentType, setAssignmentType] = useState<'lista' | 'prova'>('lista');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeLimit, setTimeLimit] = useState(90);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasExercises = useMemo(() => exercises.length > 0, [exercises]);
  const hasClassrooms = useMemo(() => classrooms.length > 0, [classrooms]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      const [classroomRes, exerciseRes] = await Promise.all([
        fetch('/api/classrooms', { cache: 'no-store' }),
        fetch('/api/exercises?limit=100', { cache: 'no-store' }),
      ]);

      if (classroomRes.ok) {
        const classroomData = await classroomRes.json();
        const classroomList: ClassroomOption[] = (classroomData.classrooms || []).map(
          (item: any) => ({
            _id: item._id,
            name: item.name,
            inviteCode: item.inviteCode,
          })
        );
        setClassrooms(classroomList);
        if (classroomList.length > 0) {
          setClassroomId(classroomList[0]._id);
        }
      } else {
        console.error('Erro ao carregar turmas');
      }

      if (exerciseRes.ok) {
        const exerciseData = await exerciseRes.json();
        const exerciseList: ExerciseOption[] = (exerciseData.exercises || []).map((item: any) => ({
          _id: item._id,
          title: item.title,
          difficulty: item.difficulty || 'medio',
          tags: item.tags || [],
          createdAt: item.createdAt,
        }));
        setExercises(exerciseList);
      } else {
        console.error('Erro ao carregar exercícios');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar informações iniciais');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exerciseId) ? prev.filter((id) => id !== exerciseId) : [...prev, exerciseId]
    );
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignmentType('lista');
    setStartDate('');
    setEndDate('');
    setTimeLimit(90);
    setSelectedExercises([]);
    if (classrooms.length > 0) {
      setClassroomId(classrooms[0]._id);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error('Informe um título para a atividade');
      return;
    }

    if (!classroomId) {
      toast.error('Selecione uma turma');
      return;
    }

    if (selectedExercises.length === 0) {
      toast.error('Escolha pelo menos um exercício');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Informe as datas de início e término');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      toast.error('A data de término deve ser posterior à data de início');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description,
          classroomId,
          exerciseIds: selectedExercises,
          type: assignmentType,
          startDate,
          endDate,
          timeLimit: assignmentType === 'prova' ? timeLimit : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível criar a atividade');
      }

      toast.success('Atividade criada com sucesso!');
      resetForm();
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao criar atividade');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova atividade</h1>
            <p className="mt-1 text-gray-600">
              Monte listas ou provas utilizando os exercícios cadastrados no CodeArena.
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

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Configuração da atividade</h2>
            <p className="text-sm text-gray-500">
              Defina título, período e tipo da atividade. Os exercícios selecionados serão avaliados
              automaticamente via Judge0.
            </p>
          </header>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              id="title"
              type="text"
              placeholder="Lista 01 - Condicionais e Loops"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
              placeholder="Explique o objetivo da atividade, orientações e critérios de correção."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="classroom" className="block text-sm font-medium text-gray-700">
                Turma
              </label>
              <select
                id="classroom"
                value={classroomId}
                onChange={(event) => setClassroomId(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {classrooms.map((classroom) => (
                  <option key={classroom._id} value={classroom._id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
              {!hasClassrooms && (
                <p className="text-xs text-amber-600">
                  Você ainda não criou turmas. Crie uma turma primeiro antes de agendar atividades.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo da atividade
              </label>
              <select
                id="type"
                value={assignmentType}
                onChange={(event) => setAssignmentType(event.target.value as any)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="lista">Lista de exercícios</option>
                <option value="prova">Prova / Avaliação</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Início</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-9 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Término</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-9 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {assignmentType === 'prova' && (
              <div className="space-y-2">
                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                  Limite de tempo (minutos)
                </label>
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="timeLimit"
                    type="number"
                    min={10}
                    step={5}
                    value={timeLimit}
                    onChange={(event) => setTimeLimit(Number(event.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-9 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Tempo máximo de prova após o aluno iniciar. Use 0 para ilimitado.
                </p>
              </div>
            )}
          </div>

          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Exercícios disponíveis</h3>
                <p className="text-sm text-gray-500">
                  Selecione quais problemas farão parte da atividade. Todos os casos de teste serão
                  avaliados automaticamente.
                </p>
              </div>
            </header>

            {hasExercises ? (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                {exercises.map((exercise) => {
                  const isChecked = selectedExercises.includes(exercise._id);
                  return (
                    <button
                      key={exercise._id}
                      type="button"
                      onClick={() => toggleExercise(exercise._id)}
                      className={`flex w-full items-start justify-between rounded-lg border px-4 py-3 text-left transition ${
                        isChecked
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary-200 hover:bg-primary-50/50'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold">{exercise.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${
                              exercise.difficulty === 'facil'
                                ? 'bg-emerald-100 text-emerald-700'
                                : exercise.difficulty === 'medio'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {difficultyLabel[exercise.difficulty]}
                          </span>
                          {(exercise.tags || []).map((tag) => (
                            <span
                              key={`${exercise._id}-${tag}`}
                              className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-1 text-primary-600">
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                Você ainda não criou exercícios. Cadastre um exercício primeiro para montar listas e
                provas.
              </div>
            )}
          </section>
        </section>

        <aside className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-3 rounded-xl bg-primary-50 p-5 text-sm text-primary-800">
            <div className="flex items-center space-x-2 font-semibold text-primary-900">
              <Users className="h-4 w-4" />
              <span>Visão geral da turma</span>
            </div>
            {classroomId ? (
              <div className="rounded-lg border border-primary-100 bg-white px-4 py-3 text-sm text-primary-900">
                <p className="font-semibold">
                  {classrooms.find((item) => item._id === classroomId)?.name || 'Turma selecionada'}
                </p>
                <p className="mt-1 text-xs text-primary-600">
                  Código de convite:{' '}
                  <span className="font-mono">
                    {classrooms.find((item) => item._id === classroomId)?.inviteCode || '---'}
                  </span>
                </p>
                <p className="mt-2 text-xs text-primary-700">
                  Os alunos dessa turma receberão automaticamente a atividade no período definido.
                </p>
              </div>
            ) : (
              <p className="text-xs text-primary-700">
                Nenhuma turma disponível no momento. Crie uma turma para agendar atividades.
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700">
            <div className="flex items-center space-x-2 font-semibold text-gray-900">
              <ListChecks className="h-4 w-4" />
              <span>Checklist final</span>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li>• Confirme se o período considera o horário correto (timezone UTC-3).</li>
              <li>• Escolha exercícios coerentes com a dificuldade da turma.</li>
              <li>
                • Para provas, defina um limite de tempo e oriente os alunos a evitarem recarregar a
                página.
              </li>
              <li>• Você poderá editar ou desativar a atividade a qualquer momento.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !hasClassrooms || !hasExercises}
            className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando atividade...
              </>
            ) : (
              'Publicar atividade'
            )}
          </button>

          <p className="text-xs text-gray-500">
            Assim que publicada, a atividade ficará visível para os alunos da turma selecionada.
            Você poderá acompanhar as submissões em tempo real pelo painel do professor.
          </p>
        </aside>
      </form>
    </div>
  );
}

