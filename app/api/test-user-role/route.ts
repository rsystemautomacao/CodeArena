import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TESTANDO USER ROLE APÓS LOGIN...');
    
    const session = await getServerSession(authOptions);
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      session: {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          image: session.user.image
        } : null
      },
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Verificar problemas
    if (!session) {
      debug.issues.push('❌ Nenhuma sessão ativa encontrada');
      debug.recommendations.push('Faça login primeiro');
    } else if (!session.user) {
      debug.issues.push('❌ Sessão existe mas usuário não encontrado');
      debug.recommendations.push('Verificar configuração do NextAuth');
    } else if (!session.user.role) {
      debug.issues.push('❌ Usuário sem papel (role) definido');
      debug.recommendations.push('Verificar callback signIn do NextAuth');
    } else {
      debug.issues.push('✅ Usuário com papel definido: ' + session.user.role);
    }

    // Adicionar instruções específicas
    debug.recommendations.push('1. Faça login com Google primeiro');
    debug.recommendations.push('2. Verifique se o papel está sendo definido no callback signIn');
    debug.recommendations.push('3. Verifique se o callback JWT está passando o papel para a sessão');

    console.log('🔍 USER ROLE TEST:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE USER ROLE:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
