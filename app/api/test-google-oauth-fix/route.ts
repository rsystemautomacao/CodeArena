import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 TESTANDO GOOGLE OAUTH FIX...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://code-arena-unasp.vercel.app';
    const callbackUrl = `${baseUrl}/api/auth/callback/google`;
    const signInUrl = `${baseUrl}/api/auth/signin/google`;
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      baseUrl,
      urls: {
        callbackUrl,
        signInUrl,
        expectedCallbackUrl: 'https://code-arena-unasp.vercel.app/api/auth/callback/google',
        expectedSignInUrl: 'https://code-arena-unasp.vercel.app/api/auth/signin/google'
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
        clientIdValid: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com'),
        clientSecretValid: process.env.GOOGLE_CLIENT_SECRET?.startsWith('GOCSPX-'),
        clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
        clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0
      },
      nextauth: {
        secret: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO',
        url: process.env.NEXTAUTH_URL,
        secretLength: process.env.NEXTAUTH_SECRET?.length || 0
      },
      instructions: {
        step1: "Verifique se estas URLs estão configuradas no Google Console:",
        googleConsoleUrls: [
          callbackUrl,
          'http://localhost:3000/api/auth/callback/google'
        ],
        step2: "Em 'Origens JavaScript autorizadas', adicione:",
        authorizedOrigins: [
          baseUrl,
          'http://localhost:3000'
        ],
        step3: "Teste o login com Google acessando:",
        testUrl: signInUrl
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
      debug.issues.push('❌ GOOGLE_CLIENT_ID formato incorreto (deve terminar com .apps.googleusercontent.com)');
    }
    if (!debug.google.clientSecretValid) {
      debug.issues.push('❌ GOOGLE_CLIENT_SECRET formato incorreto (deve começar com GOCSPX-)');
    }
    if (debug.urls.callbackUrl !== debug.urls.expectedCallbackUrl) {
      debug.issues.push('❌ Callback URL incorreto - deve ser: https://code-arena-unasp.vercel.app/api/auth/callback/google');
    }
    if (!debug.nextauth.secret) {
      debug.issues.push('❌ NEXTAUTH_SECRET não configurado');
    }
    if (debug.nextauth.url !== 'https://code-arena-unasp.vercel.app') {
      debug.issues.push('❌ NEXTAUTH_URL incorreto - deve ser: https://code-arena-unasp.vercel.app');
    }

    if (debug.issues.length === 0) {
      debug.issues.push('✅ Todas as configurações estão corretas!');
    }

    console.log('🔧 DEBUG GOOGLE OAUTH FIX:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE GOOGLE OAUTH FIX:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
