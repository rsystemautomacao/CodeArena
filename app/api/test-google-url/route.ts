import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 TESTANDO URL DO GOOGLE OAUTH...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://code-arena-unasp.vercel.app';
    const callbackUrl = `${baseUrl}/api/auth/callback/google`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    // Construir URL do Google OAuth
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
      googleAuthUrl,
      instructions: {
        step1: "Teste esta URL diretamente no navegador:",
        testUrl: googleAuthUrl,
        step2: "Se der erro 400, verifique no Google Console:",
        googleConsoleCheck: [
          "1. Se a URL de redirecionamento está exatamente como: " + callbackUrl,
          "2. Se o domínio está nas origens autorizadas: " + baseUrl,
          "3. Se o projeto Google está ativo",
          "4. Se as APIs do Google estão habilitadas"
        ],
        step3: "URLs que devem estar no Google Console:",
        requiredUrls: {
          redirectUris: [
            callbackUrl,
            'http://localhost:3000/api/auth/callback/google'
          ],
          authorizedOrigins: [
            baseUrl,
            'http://localhost:3000'
          ]
        }
      },
      commonErrors: {
        redirect_uri_mismatch: {
          description: "URL de redirecionamento não autorizada",
          solution: "Adicionar a URL exata no Google Console",
          url: callbackUrl
        },
        invalid_client: {
          description: "Client ID inválido",
          solution: "Verificar se GOOGLE_CLIENT_ID está correto",
          clientId: clientId
        },
        unauthorized_client: {
          description: "Client Secret inválido",
          solution: "Verificar se GOOGLE_CLIENT_SECRET está correto"
        },
        access_denied: {
          description: "Acesso negado",
          solution: "Verificar se o projeto Google está ativo"
        }
      }
    };

    console.log('🔗 DEBUG GOOGLE URL:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE GOOGLE URL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
