import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DIAGNOSTICANDO ERRO 400 DO GOOGLE...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://code-arena-unasp.vercel.app';
    const callbackUrl = `${baseUrl}/api/auth/callback/google`;
    const signInUrl = `${baseUrl}/api/auth/signin/google`;
    
    // Simular a URL que o Google está tentando acessar
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      baseUrl,
      urls: {
        callbackUrl,
        signInUrl,
        googleAuthUrl,
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
      possibleCauses: {
        redirectUriMismatch: {
          description: "URL de redirecionamento não autorizada no Google Console",
          check: "Verificar se a URL exata está no Google Console",
          url: callbackUrl
        },
        invalidClient: {
          description: "Client ID inválido ou incorreto",
          check: "Verificar se GOOGLE_CLIENT_ID está correto",
          clientId: process.env.GOOGLE_CLIENT_ID
        },
        unauthorizedClient: {
          description: "Client Secret inválido ou incorreto",
          check: "Verificar se GOOGLE_CLIENT_SECRET está correto",
          hasSecret: !!process.env.GOOGLE_CLIENT_SECRET
        },
        invalidScope: {
          description: "Escopo inválido ou não autorizado",
          check: "Verificar se os scopes estão corretos",
          scopes: "openid email profile"
        },
        domainMismatch: {
          description: "Domínio não autorizado no Google Console",
          check: "Verificar se o domínio está nas origens autorizadas",
          domain: baseUrl
        }
      },
      instructions: {
        step1: "Verifique no Google Console se estas URLs estão configuradas:",
        googleConsoleUrls: [
          callbackUrl,
          'http://localhost:3000/api/auth/callback/google'
        ],
        step2: "Em 'Origens JavaScript autorizadas', adicione:",
        authorizedOrigins: [
          baseUrl,
          'http://localhost:3000'
        ],
        step3: "Verifique se o projeto Google está ativo e as APIs habilitadas",
        step4: "Teste a URL do Google diretamente:",
        testGoogleUrl: googleAuthUrl
      },
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Verificar problemas específicos do erro 400
    if (!debug.google.clientId) {
      debug.issues.push('❌ GOOGLE_CLIENT_ID não configurado');
      debug.recommendations.push('Configure GOOGLE_CLIENT_ID no Vercel');
    }
    if (!debug.google.clientSecret) {
      debug.issues.push('❌ GOOGLE_CLIENT_SECRET não configurado');
      debug.recommendations.push('Configure GOOGLE_CLIENT_SECRET no Vercel');
    }
    if (!debug.google.clientIdValid) {
      debug.issues.push('❌ GOOGLE_CLIENT_ID formato incorreto');
      debug.recommendations.push('Verifique se o Client ID está correto no Google Console');
    }
    if (!debug.google.clientSecretValid) {
      debug.issues.push('❌ GOOGLE_CLIENT_SECRET formato incorreto');
      debug.recommendations.push('Verifique se o Client Secret está correto no Google Console');
    }
    if (debug.urls.callbackUrl !== debug.urls.expectedCallbackUrl) {
      debug.issues.push('❌ Callback URL incorreto');
      debug.recommendations.push('Verifique se NEXTAUTH_URL está configurado corretamente');
    }
    if (!debug.nextauth.secret) {
      debug.issues.push('❌ NEXTAUTH_SECRET não configurado');
      debug.recommendations.push('Configure NEXTAUTH_SECRET no Vercel');
    }
    if (debug.nextauth.url !== 'https://code-arena-unasp.vercel.app') {
      debug.issues.push('❌ NEXTAUTH_URL incorreto');
      debug.recommendations.push('Configure NEXTAUTH_URL=https://code-arena-unasp.vercel.app no Vercel');
    }

    // Adicionar recomendações específicas para erro 400
    debug.recommendations.push('🔧 Acesse o Google Console e verifique:');
    debug.recommendations.push('1. Se a URL de redirecionamento está exatamente como: ' + callbackUrl);
    debug.recommendations.push('2. Se o domínio está nas origens autorizadas: ' + baseUrl);
    debug.recommendations.push('3. Se o projeto Google está ativo');
    debug.recommendations.push('4. Se as APIs do Google estão habilitadas');

    if (debug.issues.length === 0) {
      debug.issues.push('✅ Configurações básicas estão corretas');
      debug.issues.push('🔍 Verifique o Google Console para URLs de redirecionamento');
    }

    console.log('🔍 DEBUG GOOGLE 400:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO DEBUG GOOGLE 400:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
