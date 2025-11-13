'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Loader2, Users, ArrowLeft, GraduationCap, Mail } from 'lucide-react';

type Student = {
  _id: string;
  name: string;
  email: string;
};

type ClassroomWithStudents = {
  _id: string;
  name: string;
  inviteCode: string;
  students: Student[];
};

export default function StudentsPage() {
  const [classrooms, setClassrooms] = useState<ClassroomWithStudents[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      toast.error(error?.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const totalStudents = classrooms.reduce(
    (sum, classroom) => sum + (classroom.students?.length || 0),
    0
  );

  const allStudents: Array<Student & { classroomName: string; classroomId: string }> = [];
  classrooms.forEach((classroom) => {
    classroom.students?.forEach((student) => {
      // Evitar duplicatas (um aluno pode estar em múltiplas turmas)
      if (!allStudents.find((s) => s._id === student._id)) {
        allStudents.push({
          ...student,
          classroomName: classroom.name,
          classroomId: classroom._id,
        });
      }
    });
  });

  if (isLoading && classrooms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-gray-600">Carregando alunos...</p>
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
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Alunos</h1>
            <p className="mt-1 text-gray-600">
              Visualize todos os alunos de suas turmas
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total de alunos únicos</p>
            <p className="text-2xl font-bold text-primary-600">{totalStudents}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {totalStudents === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Nenhum aluno matriculado ainda
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Os alunos aparecerão aqui quando se matricularem nas suas turmas
            </p>
            <Link
              href="/dashboard/classrooms"
              className="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Ver Turmas
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {classrooms
              .filter((classroom) => classroom.students && classroom.students.length > 0)
              .map((classroom) => (
                <div
                  key={classroom._id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-primary-100 p-2">
                        <GraduationCap className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {classroom.name}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Código: <span className="font-mono">{classroom.inviteCode}</span>
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/classrooms/${classroom._id}/edit`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Gerenciar turma
                    </Link>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {classroom.students.map((student) => (
                      <div
                        key={student._id}
                        className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                          <span className="text-sm font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.name}
                          </p>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Total: {classroom.students.length} aluno
                    {classroom.students.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}

            {/* Resumo geral */}
            {allStudents.length > 0 && (
              <div className="rounded-lg border border-primary-200 bg-primary-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-primary-900">
                  Resumo Geral
                </h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-primary-700">
                      Total de Turmas com Alunos
                    </p>
                    <p className="text-2xl font-bold text-primary-900">
                      {classrooms.filter((c) => c.students && c.students.length > 0).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-700">
                      Total de Alunos Matriculados
                    </p>
                    <p className="text-2xl font-bold text-primary-900">{totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-700">
                      Alunos Únicos
                    </p>
                    <p className="text-2xl font-bold text-primary-900">{allStudents.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

