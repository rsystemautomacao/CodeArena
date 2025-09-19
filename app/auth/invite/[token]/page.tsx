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

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { 
        callbackUrl: '/dashboard',
        redirect: true 
      });
    } catch (error) {
      toast.error('Erro ao fazer login com Google');
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
            Para ativar sua conta de professor, faça login com o Google usando o email:
          </p>
          <p className="text-center font-medium text-primary-600">{email}</p>
          
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-primary-500 text-white py-3 px-4 rounded-md hover:bg-primary-600 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Ativar Conta com Google
          </button>
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
