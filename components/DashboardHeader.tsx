'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import StudentSidebar from './dashboard/StudentSidebar';
import Sidebar from './dashboard/Sidebar';

interface DashboardHeaderProps {
  title?: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isStudent = session?.user?.role === 'aluno';

  const roleBadgeStyle =
    session?.user?.role === 'superadmin'
      ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20'
      : session?.user?.role === 'professor'
      ? 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20'
      : 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20';

  const roleLabel =
    session?.user?.role === 'superadmin'
      ? 'Super Admin'
      : session?.user?.role === 'professor'
      ? 'Professor'
      : 'Aluno';

  const avatarGradient = isStudent
    ? 'from-emerald-500 to-teal-600'
    : 'from-blue-500 to-indigo-600';

  return (
    <>
      {isStudent ? (
        <StudentSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={session?.user?.name}
        />
      ) : (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={session?.user?.name}
        />
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              {title && (
                <h1 className="text-base font-semibold text-gray-900">{title}</h1>
              )}
            </div>

            {/* Right */}
            {session?.user?.name && (
              <div className="flex items-center gap-3">
                <span
                  className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${roleBadgeStyle}`}
                >
                  {roleLabel}
                </span>
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                >
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[160px] truncate">
                  {session.user.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
