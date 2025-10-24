'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export default function InvitePage() {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const validateInvite = async () => {
      try {
        console.log('🎯 [PAGE] Validando convite com token:', params.token);
        const response = await fetch(`/api/invites/validate/${params.token}`);
        const data = await response.json();
        
        console.log('🎯 [PAGE] Resposta da API:', data);

        if (data.valid) {
          setIsValid(true);
          setEmail(data.email);
        } else {
          setError(data.error || 'Convite inválido');
        }
      } catch (error) {
        console.error('🎯 [PAGE] Erro na validação:', error);
        setError('Erro ao validar convite');
      } finally {
        setIsValidating(false);
      }
    };

    if (params.token) {
      validateInvite();
    }
  }, [params.token]);


  const handleCreateAccountWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsCreatingAccount(true);
    
    try {
      // Criar conta de professor
      const response = await fetch('/api/auth/create-professor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          inviteToken: params.token
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Conta criada com sucesso!');
        
        // Fazer login automaticamente
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.ok) {
          router.push('/dashboard');
        } else {
          toast.error('Erro ao fazer login. Tente fazer login manualmente.');
          router.push('/auth/signin');
        }
      } else {
        toast.error(data.error || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite Inválido
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          
          {/* Informações de debug em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-md text-left">
              <p className="text-sm text-yellow-800 font-medium mb-2">Debug Info:</p>
              <p className="text-xs text-yellow-700">Token: {params.token}</p>
              <p className="text-xs text-yellow-700">Ambiente: Desenvolvimento</p>
              <p className="text-xs text-yellow-700">Status: Simulado</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors"
            >
              Voltar ao Login
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                Tentar Novamente
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <div className="text-green-500 text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite Válido!
          </h1>
          <p className="text-gray-600">
            Você foi convidado para ser um professor no CodeArena
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Email: <span className="font-medium">{email}</span>
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Para ativar sua conta de professor, escolha uma das opções abaixo:
          </p>
          <p className="text-center font-medium text-primary-600">{email}</p>
          
          {!showPasswordForm ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Para ativar sua conta como professor, você precisa criar uma senha.
              </p>
              
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Criar Conta com Senha
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateAccountWithPassword} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="Digite sua senha"
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="Confirme sua senha"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingAccount ? 'Criando...' : 'Criar Conta'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Este convite expira em 24 horas ou após o primeiro uso
          </p>
        </div>
      </div>
    </div>
  );
}
