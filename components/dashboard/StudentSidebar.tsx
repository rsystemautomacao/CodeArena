'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  Users,
  BookOpen,
  Clock,
  User,
  LogOut,
  FileText,
  Code2,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function StudentSidebar({
  isOpen,
  onClose,
  userName: propUserName,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || propUserName;

  const menuItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Minhas Turmas', href: '/dashboard/classrooms/student', icon: Users },
    { title: 'Atividades', href: '/dashboard/assignments', icon: Clock },
    { title: 'Exercícios Públicos', href: '/dashboard/exercises', icon: BookOpen },
    { title: 'Minhas Submissões', href: '/dashboard/submissions', icon: FileText },
    { title: 'Perfil', href: '/dashboard/profile', icon: User },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <>
      {/* Overlay — apenas no mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/50">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">CodeArena</span>
          </Link>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        {userName && (
          <div className="px-5 py-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
                <p className="text-xs text-slate-400">Aluno</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span className="text-sm font-medium">{item.title}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer — Logout */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
