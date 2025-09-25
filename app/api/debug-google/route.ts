import { NextResponse } from 'next/server';

export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    test: 'GOOGLE OAUTH TEST',
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      clientIdValid: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com'),
      clientSecretValid: process.env.GOOGLE_CLIENT_SECRET?.startsWith('GOCSPX-'),
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      clientSecretPrefix: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 10) + '...'
    },
    urls: {
      nextauthUrl: process.env.NEXTAUTH_URL,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      expectedCallbackUrl: 'https://code-arena-unasp.vercel.app/api/auth/callback/google'
    },
    expectedGoogleConfig: {
      authorizedOrigins: [
        'https://code-arena-unasp.vercel.app',
        'http://localhost:3000'
      ],
      authorizedRedirects: [
        'https://code-arena-unasp.vercel.app/api/auth/callback/google',
        'http://localhost:3000/api/auth/callback/google'
      ]
    },
    issues: [] as string[]
  };

  // Verificar problemas
  if (!debug.google.clientId) {
    debug.issues.push('❌ GOOGLE_CLIENT_ID não configurado');
  }
  if (!debug.google.clientSecret) {
    debug.issues.push('❌ GOOGLE_CLIENT_SECRET não configurado');
  }
  if (!debug.google.clientIdValid) {
    debug.issues.push('❌ GOOGLE_CLIENT_ID formato incorreto');
  }
  if (!debug.google.clientSecretValid) {
    debug.issues.push('❌ GOOGLE_CLIENT_SECRET formato incorreto');
  }
  if (debug.urls.nextauthUrl !== 'https://code-arena-unasp.vercel.app') {
    debug.issues.push('❌ NEXTAUTH_URL incorreto');
  }
  if (debug.urls.callbackUrl !== debug.urls.expectedCallbackUrl) {
    debug.issues.push('❌ Callback URL incorreto');
  }

  if (debug.issues.length === 0) {
    debug.issues.push('✅ Todas as configurações parecem corretas');
  }

  console.log('🔍 GOOGLE OAUTH TEST:', JSON.stringify(debug, null, 2));
  
  return NextResponse.json(debug);
}
