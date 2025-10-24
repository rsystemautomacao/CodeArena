import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 FORÇANDO GOOGLE AUTH SEM CACHE...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://code-arena-unasp.vercel.app';
    const callbackUrl = `${baseUrl}/api/auth/callback/google`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    // URL do Google OAuth com timestamp para evitar cache
    const timestamp = Date.now();
    const googleAuthUrl = `https://accounts.google.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${timestamp}`;
    
    const response = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      baseUrl,
      callbackUrl,
      clientId,
      googleAuthUrl,
      instructions: {
        step1: "Teste esta URL diretamente (modo incógnito):",
        testUrl: googleAuthUrl,
        step2: "Se funcionar, o problema é cache do navegador",
        step3: "Se não funcionar, o problema é no Google Console",
        step4: "Verifique se estas URLs estão no Google Console:",
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
      cacheBusting: {
        description: "URL com timestamp para evitar cache",
        timestamp: timestamp,
        note: "Use esta URL para testar sem cache"
      }
    };

    console.log('🔄 FORCE GOOGLE AUTH:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.log('❌ ERRO NO FORCE GOOGLE AUTH:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
