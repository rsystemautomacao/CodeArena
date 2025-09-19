'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'Há um problema com a configuração do servidor.';
      case 'AccessDenied':
        return 'Acesso negado. Você não tem permissão para fazer login.';
      case 'Verification':
        return 'O token de verificação expirou ou já foi usado.';
      case 'Default':
        return 'Ocorreu um erro inesperado durante o login.';
      default:
        return 'Ocorreu um erro durante o processo de autenticação.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-red-500 text-6xl mb-4">
          <AlertCircle className="w-16 h-16 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Erro de Autenticação
        </h1>
        
        <p className="text-gray-600 mb-6">
          {getErrorMessage(error)}
        </p>
        
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 transition-colors inline-block"
          >
            Tentar Novamente
          </Link>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar ao Início
          </Link>
        </div>
        
        {error && (
          <div className="mt-6 p-3 bg-gray-100 rounded-md">
            <p className="text-xs text-gray-500">
              Código do erro: <span className="font-mono">{error}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
