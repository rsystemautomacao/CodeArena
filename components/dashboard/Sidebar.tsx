'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  BookOpen,
  Clock,
  GraduationCap,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function Sidebar({ isOpen, onClose, userName: propUserName }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Usar nome da sessão se disponível, senão usar prop
  const userName = session?.user?.name || propUserName;

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Turmas',
      href: '/dashboard/classrooms',
      icon: Users,
    },
    {
      title: 'Exercícios',
      href: '/dashboard/exercises',
      icon: BookOpen,
    },
    {
      title: 'Atividades',
      href: '/dashboard/assignments',
      icon: Clock,
    },
    {
      title: 'Alunos',
      href: '/dashboard/students',
      icon: GraduationCap,
    },
    {
      title: 'Configurações',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <>
      {/* Overlay para mobile e desktop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header do Sidebar */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-primary-500">CodeArena</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          {userName && (
            <div className="p-4 border-b bg-gray-50">
              <p className="text-sm text-gray-600">Olá,</p>
              <p className="font-semibold text-gray-900">{userName}</p>
            </div>
          )}

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        // Fechar menu ao clicar em qualquer item
                        onClose();
                      }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer com Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

