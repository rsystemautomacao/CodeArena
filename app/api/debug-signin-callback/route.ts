import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUGANDO SIGNIN CALLBACK...');
    
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
      analysis: {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasRole: !!session?.user?.role,
        roleValue: session?.user?.role || 'UNDEFINED',
        email: session?.user?.email || 'NO_EMAIL'
      },
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Análise detalhada
    if (!session) {
      debug.issues.push('❌ Nenhuma sessão ativa');
      debug.recommendations.push('Faça login primeiro');
    } else if (!session.user) {
      debug.issues.push('❌ Sessão existe mas usuário é null');
      debug.recommendations.push('Problema na configuração do NextAuth');
    } else if (!session.user.role) {
      debug.issues.push('❌ Usuário sem papel definido');
      debug.recommendations.push('Problema no callback signIn - papel não está sendo definido');
      debug.recommendations.push('Verificar se o callback signIn está executando corretamente');
    } else {
      debug.issues.push('✅ Usuário com papel definido: ' + session.user.role);
    }

    // Adicionar informações de debug específicas
    debug.recommendations.push('1. Verificar logs do servidor para ver se o callback signIn está sendo executado');
    debug.recommendations.push('2. Verificar se o usuário está sendo criado/encontrado no banco de dados');
    debug.recommendations.push('3. Verificar se o user.role está sendo definido no callback signIn');

    console.log('🔍 SIGNIN CALLBACK DEBUG:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO DEBUG SIGNIN CALLBACK:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
