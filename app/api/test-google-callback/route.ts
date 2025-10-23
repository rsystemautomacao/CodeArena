import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://code-arena-unasp.vercel.app';
    
    const callbackUrl = `${baseUrl}/api/auth/callback/google`;
    const signInUrl = `${baseUrl}/api/auth/signin/google`;
    
    const testUrls = {
      baseUrl,
      callbackUrl,
      signInUrl,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      instructions: {
        step1: "Adicione esta URL no Google Console:",
        callbackUrl: callbackUrl,
        step2: "Em 'Origens JavaScript autorizadas', adicione:",
        origin: baseUrl,
        step3: "Verifique se as variáveis estão configuradas:",
        envVars: {
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO',
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'FALTANDO',
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO'
        }
      }
    };

    return NextResponse.json(testUrls);
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
