import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 TESTE FINAL DO GOOGLE OAUTH...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://code-arena-unasp.vercel.app';
    const callbackUrl = `${baseUrl}/api/auth/callback/google`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Construir URL do Google OAuth para teste
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
      status: 'CONFIGURADO CORRETAMENTE',
      nextSteps: [
        '1. Teste a URL do Google diretamente:',
        googleAuthUrl,
        '2. Se der erro 400, verifique no Google Console:',
        '   - Se a URL de redirecionamento está EXATAMENTE como: ' + callbackUrl,
        '   - Se não há URLs duplicadas ou incorretas',
        '   - Se não há espaços extras ou caracteres especiais',
        '3. Aguarde 5-10 minutos após fazer alterações',
        '4. Teste em modo incógnito'
      ],
      commonIssues: {
        redirect_uri_mismatch: {
          description: 'URL de redirecionamento não autorizada',
          solution: 'Verificar se a URL está EXATAMENTE como configurada no Google Console',
          checkUrl: callbackUrl
        },
        invalid_client: {
          description: 'Client ID inválido',
          solution: 'Verificar se GOOGLE_CLIENT_ID está correto',
          clientId: clientId
        },
        unauthorized_client: {
          description: 'Client Secret inválido',
          solution: 'Verificar se GOOGLE_CLIENT_SECRET está correto',
          hasSecret: !!clientSecret
        }
      },
      testInstructions: {
        step1: 'Acesse esta URL para testar o Google OAuth:',
        testUrl: googleAuthUrl,
        step2: 'Se der erro 400, verifique no Google Console:',
        googleConsoleCheck: [
          '1. Vá para APIs e Serviços > Credenciais',
          '2. Clique no seu OAuth 2.0 Client ID',
          '3. Em "Authorized redirect URIs", verifique se está:',
          '   ' + callbackUrl,
          '4. Remova qualquer URL duplicada ou incorreta',
          '5. Salve as alterações'
        ]
      }
    };

    console.log('🎯 TESTE FINAL GOOGLE:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE FINAL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
