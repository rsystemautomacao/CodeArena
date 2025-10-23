'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginDirect() {
  const [email, setEmail] = useState('admin@rsystem.com');
  const [password, setPassword] = useState('@Desbravadores@93');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState<'nextauth' | 'direct'>('nextauth');
  const router = useRouter();

  const handleNextAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 TENTANDO LOGIN COM NEXTAUTH...');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('🔐 RESULTADO NEXTAUTH:', result);

      if (result?.error) {
        setError('Erro no NextAuth: ' + result.error);
        console.log('❌ ERRO NEXTAUTH:', result.error);
      } else if (result?.ok) {
        console.log('✅ LOGIN NEXTAUTH SUCESSO!');
        // Aguardar um pouco para garantir que a sessão seja estabelecida
        setTimeout(() => {
          console.log('🔄 REDIRECIONANDO PARA DASHBOARD...');
          router.push('/dashboard');
          router.refresh(); // Forçar atualização da página
          
          // Fallback: usar window.location se router não funcionar
          setTimeout(() => {
            if (window.location.pathname === '/login-direct') {
              console.log('⚠️ ROUTER NÃO FUNCIONOU, USANDO WINDOW.LOCATION...');
              window.location.href = '/dashboard';
            }
          }, 1000);
        }, 100);
      } else {
        setError('Erro desconhecido no NextAuth');
      }
    } catch (error) {
      console.error('Erro no NextAuth:', error);
      setError('Erro de conexão com NextAuth');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 TENTANDO LOGIN DIRETO...');
      const response = await fetch('/api/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔐 RESULTADO LOGIN DIRETO:', data);

      if (data.success) {
        // Salvar token no localStorage
        localStorage.setItem('auth-token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('✅ LOGIN DIRETO SUCESSO:', data.user);
        
        // Aguardar um pouco e redirecionar para dashboard
        setTimeout(() => {
          console.log('🔄 REDIRECIONANDO PARA DASHBOARD...');
          router.push('/dashboard');
          router.refresh(); // Forçar atualização da página
          
          // Fallback: usar window.location se router não funcionar
          setTimeout(() => {
            if (window.location.pathname === '/login-direct') {
              console.log('⚠️ ROUTER NÃO FUNCIONOU, USANDO WINDOW.LOCATION...');
              window.location.href = '/dashboard';
            }
          }, 1000);
        }, 100);
      } else {
        setError(data.message || 'Erro no login direto');
      }
    } catch (error) {
      console.error('Erro no login direto:', error);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = loginMethod === 'nextauth' ? handleNextAuthLogin : handleDirectLogin;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Login - CodeArena
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de autenticação com fallback
          </p>
        </div>
        
        {/* Seletor de método de login */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setLoginMethod('nextauth')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              loginMethod === 'nextauth'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            NextAuth
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('direct')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
              loginMethod === 'direct'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Login Direto
          </button>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : `Entrar (${loginMethod === 'nextauth' ? 'NextAuth' : 'Direto'})`}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Método atual: <strong>{loginMethod === 'nextauth' ? 'NextAuth' : 'Login Direto'}</strong>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Use NextAuth para integração completa, ou Login Direto como fallback
          </p>
        </div>
      </div>
    </div>
  );
}
