'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Users, BookOpen, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

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
  createdAt: string;
}

export default function StudentClassroomsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/classrooms');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Erro ao carregar turmas');
      }

      const data = await response.json();
      setClassrooms(data.classrooms || []);
    } catch (error: any) {
      console.error('Erro ao carregar turmas:', error);
      toast.error(error?.message || 'Erro ao carregar turmas');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando turmas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="Minhas Turmas" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600 mb-6">
          Visualize e acesse suas turmas
        </p>

        {/* Classrooms Grid */}
        {classrooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma turma encontrada
            </h2>
            <p className="text-gray-600 mb-6">
              Você ainda não está matriculado em nenhuma turma.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Voltar para o Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <Link
                key={classroom._id}
                href={`/dashboard/classrooms/${classroom._id}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {classroom.name}
                    </h3>
                    {classroom.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {classroom.description}
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-primary-100 rounded-lg ml-4">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>Prof. {classroom.professor.name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Criada em {new Date(classroom.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400 font-mono mt-2 pt-2 border-t border-gray-200">
                    <span>Código: {classroom.inviteCode}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

