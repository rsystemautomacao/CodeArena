'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Code2, Zap, Users, Trophy, ArrowRight, CheckCircle, Terminal } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Code2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CodeArena</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="text-slate-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <Zap className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">
              Plataforma de Programação Interativa
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Aprenda código com
            <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mt-2">
              desafios reais
            </span>
          </h1>

          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            CodeArena conecta professores e alunos através de exercícios de programação com
            correção automática, turmas virtuais e acompanhamento em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
            >
              Começar agora grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:scale-105"
            >
              Já tenho conta
            </Link>
          </div>

          {/* Code card preview */}
          <div className="mt-16 mx-auto max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 text-left">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs text-slate-400 font-mono">exercicio_01.py</span>
            </div>
            <div className="p-5 font-mono text-sm leading-relaxed">
              <p>
                <span className="text-purple-400">def </span>
                <span className="text-blue-400">soma_digitos</span>
                <span className="text-white">(n):</span>
              </p>
              <p className="ml-4 text-slate-500"># Retorna a soma dos dígitos de n</p>
              <p className="ml-4">
                <span className="text-purple-400">return </span>
                <span className="text-green-400">sum</span>
                <span className="text-white">(</span>
                <span className="text-green-400">int</span>
                <span className="text-white">(d) </span>
                <span className="text-purple-400">for </span>
                <span className="text-white">d </span>
                <span className="text-purple-400">in </span>
                <span className="text-yellow-400">str</span>
                <span className="text-white">(</span>
                <span className="text-green-400">abs</span>
                <span className="text-white">(n)))</span>
              </p>
              <p className="mt-4 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Aceito — 5/5 casos de teste
                </span>
                <span className="text-slate-500 text-xs">0.042s</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Linguagens suportadas', value: '5+' },
              { label: 'Correção automática', value: '100%' },
              { label: 'Tipos de exercício', value: '∞' },
              { label: 'Disponibilidade', value: '24/7' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tudo que você precisa para ensinar e aprender
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Uma plataforma completa para professores criarem exercícios e alunos evoluírem
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Para Professores',
                description:
                  'Crie turmas, exercícios com casos de teste e provas cronometradas. Acompanhe o progresso de cada aluno em tempo real.',
                gradient: 'from-blue-500 to-indigo-600',
                border: 'border-blue-500/20 hover:border-blue-500/40',
              },
              {
                icon: Terminal,
                title: 'Para Alunos',
                description:
                  'Resolva exercícios diretamente no browser, receba feedback instantâneo e acompanhe seu histórico de submissões.',
                gradient: 'from-emerald-500 to-teal-600',
                border: 'border-emerald-500/20 hover:border-emerald-500/40',
              },
              {
                icon: Zap,
                title: 'Correção Automática',
                description:
                  'Motor de execução em nuvem com suporte a Python, Java, C, C++ e JavaScript. Resultados em segundos.',
                gradient: 'from-purple-500 to-pink-600',
                border: 'border-purple-500/20 hover:border-purple-500/40',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`bg-slate-900 border ${feature.border} rounded-2xl p-6 hover:scale-[1.02] transition-all duration-200`}
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-5`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Linguagens suportadas
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Python', color: 'from-yellow-400 to-yellow-600' },
              { name: 'Java', color: 'from-orange-400 to-red-600' },
              { name: 'C', color: 'from-blue-400 to-blue-600' },
              { name: 'C++', color: 'from-indigo-400 to-purple-600' },
              { name: 'JavaScript', color: 'from-yellow-300 to-yellow-500' },
            ].map((lang) => (
              <div
                key={lang.name}
                className="bg-slate-900 border border-slate-700 rounded-xl px-6 py-4 flex items-center gap-3 hover:border-slate-500 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${lang.color}`} />
                <span className="font-semibold text-white">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />
            <div className="relative">
              <Trophy className="h-12 w-12 text-white/80 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Pronto para começar?
              </h2>
              <p className="text-blue-100 mb-8 text-lg">
                Crie sua conta gratuita e comece a resolver exercícios hoje mesmo
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 rounded-xl text-base font-bold transition-all hover:scale-105 shadow-lg"
              >
                Criar conta gratuita
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
              <Code2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">CodeArena</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CodeArena. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
