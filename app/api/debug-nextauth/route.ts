import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    console.log('🔍 DEBUG NEXTAUTH CONFIGURAÇÃO...');
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      // Configuração do NextAuth
      nextauth: {
        providers: authOptions.providers.map((provider: any) => ({
          id: provider.id,
          name: provider.name,
          type: provider.type || 'unknown'
        })),
        
        callbacks: {
          signIn: !!authOptions.callbacks?.signIn,
          jwt: !!authOptions.callbacks?.jwt,
          session: !!authOptions.callbacks?.session
        },
        
        pages: authOptions.pages,
        session: authOptions.session,
        secret: !!authOptions.secret
      },
      
      // Teste de credenciais específico
      credentialsTest: {
        email: 'admin@rsystem.com',
        password: '@Desbravadores@93',
        nodeEnv: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV === 'development'
      },
      
      // Variáveis de ambiente críticas
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO',
        MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADO' : 'FALTANDO',
        SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
        SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO'
      }
    };

    console.log('✅ DEBUG NEXTAUTH:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error: any) {
    console.error('❌ ERRO NO DEBUG NEXTAUTH:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro no debug NextAuth',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
