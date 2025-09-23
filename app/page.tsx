'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado e não está carregando, mostrar a página inicial
  if (status === 'unauthenticated') {
    // Não fazer nada aqui, deixar renderizar a página inicial
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-success-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-primary-500">CodeArena</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Aprenda Programação de Forma
            <span className="text-primary-500"> Interativa</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            CodeArena é uma plataforma educacional que conecta professores e alunos 
            através de exercícios de programação, correção automática e acompanhamento 
            de progresso em tempo real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              className="bg-primary-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Começar Agora
            </Link>
            <Link
              href="#features"
              className="bg-white text-primary-500 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-primary-500 hover:bg-primary-50 transition-colors"
            >
              Saiba Mais
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Recursos da Plataforma
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary-500 text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-semibold mb-2">Para Professores</h3>
              <p className="text-gray-600">
                Crie exercícios, turmas e acompanhe o progresso dos alunos com 
                relatórios detalhados e correção automática.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-success-500 text-4xl mb-4">👨‍🎓</div>
              <h3 className="text-xl font-semibold mb-2">Para Alunos</h3>
              <p className="text-gray-600">
                Pratique programação com exercícios interativos, receba feedback 
                instantâneo e acompanhe seu progresso.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary-500 text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Correção Automática</h3>
              <p className="text-gray-600">
                Sistema de correção em tempo real com suporte a múltiplas 
                linguagens de programação.
              </p>
            </div>
          </div>
        </div>

        {/* Languages Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Linguagens Suportadas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {['Python', 'Java', 'C', 'C++', 'JavaScript'].map((lang) => (
              <div key={lang} className="bg-white p-4 rounded-lg shadow-md text-center">
                <div className="text-2xl font-semibold text-primary-500">{lang}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-primary-500 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Junte-se a milhares de estudantes e professores que já usam o CodeArena
          </p>
          <Link
            href="/auth/signin"
            className="bg-white text-primary-500 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Criar Conta Gratuita
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 CodeArena. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
