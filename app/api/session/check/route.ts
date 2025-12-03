import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserActiveSession, isSessionActive } from '@/lib/session-manager';

/**
 * GET - Verificar se a sessão do usuário está ativa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas alunos precisam de controle de sessão única
    if (session.user.role !== 'aluno') {
      return NextResponse.json({
        isActive: true,
        message: 'Controle de sessão não necessário para este tipo de usuário',
      });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário não encontrado' },
        { status: 400 }
      );
    }

    // Buscar sessão ativa do usuário
    const activeSession = await getUserActiveSession(userId);

    if (!activeSession) {
      return NextResponse.json({
        isActive: false,
        message: 'Nenhuma sessão ativa encontrada',
      });
    }

    // Verificar se a sessão ainda está válida (não expirou)
    const now = new Date();
    const lastActivity = new Date(activeSession.lastActivity);
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    const maxInactivity = 30 * 60 * 1000; // 30 minutos

    const isExpired = timeSinceActivity > maxInactivity;

    return NextResponse.json({
      isActive: !isExpired,
      session: {
        ipAddress: activeSession.ipAddress,
        lastActivity: activeSession.lastActivity,
        timeSinceActivity: Math.floor(timeSinceActivity / 1000), // em segundos
      },
      expired: isExpired,
    });
  } catch (error: any) {
    console.error('Erro ao verificar sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

