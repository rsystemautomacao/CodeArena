import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createUserSession, invalidateUserSessions } from '@/lib/session-manager';
import { getClientIP } from '@/lib/ip-validation';

/**
 * POST - Registrar uma nova sessão após login
 * Esta API deve ser chamada após o login bem-sucedido para registrar a sessão com IP
 */
export async function POST(request: NextRequest) {
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
        success: true,
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

    // Gerar um token único para esta sessão
    const sessionToken = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Invalidar todas as sessões anteriores do aluno
    const invalidatedCount = await invalidateUserSessions(userId, sessionToken);
    console.log(`🔒 Sessões anteriores invalidadas para aluno ${userId}: ${invalidatedCount}`);

    // Criar nova sessão com IP e User Agent
    const success = await createUserSession(userId, sessionToken, request);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao criar sessão' },
        { status: 500 }
      );
    }

    const clientIP = getClientIP(request);

    return NextResponse.json({
      success: true,
      sessionToken,
      clientIP,
      message: 'Sessão registrada com sucesso',
      invalidatedSessions: invalidatedCount,
    });
  } catch (error: any) {
    console.error('Erro ao registrar sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

