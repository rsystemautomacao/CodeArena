import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TESTANDO GOOGLE PROVIDER...');
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      authConfig: {
        providers: authOptions.providers?.map(provider => ({
          id: provider.id,
          name: provider.name,
          type: provider.type,
          hasClientId: provider.id === 'google' ? !!process.env.GOOGLE_CLIENT_ID : 'N/A',
          hasClientSecret: provider.id === 'google' ? !!process.env.GOOGLE_CLIENT_SECRET : 'N/A'
        })) || [],
        callbacks: {
          signIn: !!authOptions.callbacks?.signIn,
          jwt: !!authOptions.callbacks?.jwt,
          session: !!authOptions.callbacks?.session
        },
        pages: authOptions.pages,
        session: authOptions.session
      },
      envVars: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO'
      },
      googleProvider: {
        isConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
        clientIdValid: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com'),
        clientSecretValid: process.env.GOOGLE_CLIENT_SECRET?.startsWith('GOCSPX-')
      },
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Verificar problemas
    if (!debug.envVars.GOOGLE_CLIENT_ID) {
      debug.issues.push('❌ GOOGLE_CLIENT_ID não configurado');
      debug.recommendations.push('Configure GOOGLE_CLIENT_ID no Vercel');
    }
    if (!debug.envVars.GOOGLE_CLIENT_SECRET) {
      debug.issues.push('❌ GOOGLE_CLIENT_SECRET não configurado');
      debug.recommendations.push('Configure GOOGLE_CLIENT_SECRET no Vercel');
    }
    if (!debug.googleProvider.clientIdValid) {
      debug.issues.push('❌ GOOGLE_CLIENT_ID formato incorreto');
      debug.recommendations.push('Verificar se o Client ID está correto');
    }
    if (!debug.googleProvider.clientSecretValid) {
      debug.issues.push('❌ GOOGLE_CLIENT_SECRET formato incorreto');
      debug.recommendations.push('Verificar se o Client Secret está correto');
    }
    if (!debug.googleProvider.isConfigured) {
      debug.issues.push('❌ Google Provider não configurado');
      debug.recommendations.push('Verificar se as variáveis estão configuradas no Vercel');
    }

    if (debug.issues.length === 0) {
      debug.issues.push('✅ Google Provider configurado corretamente');
    }

    console.log('🧪 TESTE GOOGLE PROVIDER:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE GOOGLE PROVIDER:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
