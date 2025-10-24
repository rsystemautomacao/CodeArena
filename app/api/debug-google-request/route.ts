import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUGANDO REQUISIÇÃO PARA O GOOGLE...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://code-arena-unasp.vercel.app';
    const callbackUrl = `${baseUrl}/api/auth/callback/google`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Construir a URL exata que o NextAuth está enviando para o Google
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      baseUrl,
      callbackUrl,
      clientId,
      clientSecret: clientSecret ? 'CONFIGURADO' : 'FALTANDO',
      googleAuthUrl,
      urlComponents: {
        clientId: clientId,
        redirectUri: callbackUrl,
        responseType: 'code',
        scope: 'openid email profile',
        accessType: 'offline',
        prompt: 'consent'
      },
      possibleIssues: {
        clientIdInvalid: {
          description: 'Client ID não reconhecido pelo Google',
          check: 'Verificar se o Client ID está correto no Google Console',
          value: clientId
        },
        redirectUriMismatch: {
          description: 'URL de redirecionamento não autorizada',
          check: 'Verificar se a URL está exatamente como configurada no Google Console',
          value: callbackUrl
        },
        projectInactive: {
          description: 'Projeto Google inativo',
          check: 'Verificar se o projeto está ativo no Google Console'
        },
        apisNotEnabled: {
          description: 'APIs do Google não habilitadas',
          check: 'Verificar se as APIs estão habilitadas no Google Console'
        }
      },
      testSteps: {
        step1: 'Teste esta URL diretamente no navegador:',
        testUrl: googleAuthUrl,
        step2: 'Se der erro 400, o problema é no Google Console',
        step3: 'Verifique no Google Console:',
        googleConsoleCheck: [
          '1. Vá para https://console.cloud.google.com/',
          '2. Selecione seu projeto',
          '3. Vá para APIs e Serviços > Credenciais',
          '4. Clique no seu OAuth 2.0 Client ID',
          '5. Em "Authorized redirect URIs", verifique se está:',
          `   ${callbackUrl}`,
          '6. Em "Authorized JavaScript origins", verifique se está:',
          `   ${baseUrl}`,
          '7. Verifique se o projeto está ativo',
          '8. Verifique se as APIs estão habilitadas'
        ]
      },
      immediateActions: [
        '1. Acesse o Google Console',
        '2. Verifique se o Client ID está correto',
        '3. Verifique se a URL de redirecionamento está exata',
        '4. Verifique se o projeto está ativo',
        '5. Teste a URL diretamente'
      ]
    };

    console.log('🔍 DEBUG GOOGLE REQUEST:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO DEBUG GOOGLE REQUEST:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

