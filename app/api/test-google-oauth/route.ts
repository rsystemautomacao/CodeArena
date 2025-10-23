import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TESTANDO GOOGLE OAUTH...');
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
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
      urls: {
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
        signInUrl: `${process.env.NEXTAUTH_URL}/api/auth/signin/google`,
        currentUrl: request.url
      },
      allEnvVars: Object.keys(process.env).filter(key => 
        key.includes('GOOGLE') || 
        key.includes('NEXTAUTH')
      )
    };

    console.log('🔍 DEBUG GOOGLE OAUTH:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE GOOGLE OAUTH:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
