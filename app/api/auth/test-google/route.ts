import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  // Teste 1: Verificar se as credenciais estão presentes
  const hasCredentials = !!(clientId && clientSecret);
  
  // Teste 2: Verificar formato do Client ID
  const clientIdFormat = clientId ? clientId.includes('.apps.googleusercontent.com') : false;
  
  // Teste 3: Verificar formato do Client Secret
  const clientSecretFormat = clientSecret ? clientSecret.startsWith('GOCSPX-') : false;
  
  // Teste 4: Verificar URLs autorizadas
  const authorizedOrigins = [
    'https://code-arena-unasp.vercel.app',
    'http://localhost:3000'
  ];
  
  const authorizedRedirects = [
    'https://code-arena-unasp.vercel.app/api/auth/callback/google',
    'http://localhost:3000/api/auth/callback/google'
  ];

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    tests: {
      hasCredentials,
      clientIdFormat,
      clientSecretFormat,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0,
      clientIdPrefix: clientId?.substring(0, 10) + '...',
      clientSecretPrefix: clientSecret?.substring(0, 10) + '...',
    },
    urls: {
      authorizedOrigins,
      authorizedRedirects,
      currentOrigin: 'https://code-arena-unasp.vercel.app',
      currentRedirect: 'https://code-arena-unasp.vercel.app/api/auth/callback/google'
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL
    },
    recommendations: [
      hasCredentials ? '✅ Credenciais presentes' : '❌ Credenciais faltando',
      clientIdFormat ? '✅ Client ID formato correto' : '❌ Client ID formato incorreto',
      clientSecretFormat ? '✅ Client Secret formato correto' : '❌ Client Secret formato incorreto',
      'Verificar se as URLs estão configuradas no Google Console',
      'Verificar se o projeto Google Cloud está ativo',
      'Verificar se as APIs do Google estão habilitadas'
    ]
  });
}
