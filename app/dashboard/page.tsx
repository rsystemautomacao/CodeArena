'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && session?.user) {
      // Verificar se é aluno e se o perfil não foi completado
      if (session.user.role === 'aluno' && !session.user.profileCompleted) {
        // Verificar no banco de dados se realmente não completou
        fetch('/api/profile')
          .then(res => res.json())
          .then(data => {
            if (!data.profileCompleted && typeof window !== 'undefined' && window.location.pathname !== '/dashboard/profile') {
              router.push('/dashboard/profile?firstLogin=true');
            }
          })
          .catch(() => {
            // Em caso de erro, verificar se está na página de perfil
            if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard/profile') {
              router.push('/dashboard/profile?firstLogin=true');
            }
          });
      }
    }
  }, [status, router, session]);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null;
  }

  const renderDashboard = () => {
    switch (session.user.role) {
      case 'superadmin':
        return <SuperAdminDashboard />;
      case 'professor':
        return <TeacherDashboard />;
      case 'aluno':
        return <StudentDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Papel de usuário não reconhecido
            </h1>
            <p className="text-gray-600">
              Entre em contato com o administrador do sistema.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}
    </div>
  );
}
