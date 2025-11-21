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

  return (
    <>
      {/* Sidebar */}
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

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/dashboard" className="text-2xl font-bold text-primary-500 hover:text-primary-600 transition-colors">
                CodeArena
              </Link>
              {session?.user?.name && (
                <span className={`ml-4 px-3 py-1 text-sm font-medium rounded-full ${
                  session.user.role === 'superadmin' 
                    ? 'bg-red-100 text-red-800'
                    : session.user.role === 'professor'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {session.user.name}
                </span>
              )}
            </div>
          </div>
          {title && (
            <div className="pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

