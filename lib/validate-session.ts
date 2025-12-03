/**
 * Validação de sessão ativa para rotas protegidas
 * Usado especialmente para provas
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { isSessionActive } from './session-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Verificar se a sessão do usuário está ativa
 * Retorna null se válida, ou uma resposta de erro se inválida
 */
export async function validateActiveSession(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Apenas validar para alunos (professores e superadmin podem ter múltiplas sessões)
    if (session.user.role !== 'aluno') {
      return null; // Sessão válida
    }

    // Obter sessionToken do JWT (precisamos acessar o token)
    // Como não temos acesso direto ao token no getServerSession,
    // vamos usar uma abordagem diferente: verificar se há sessão ativa no banco
    
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário não encontrado' },
        { status: 400 }
      );
    }

    // Buscar sessão ativa do usuário
    const { getUserActiveSession } = await import('./session-manager');
    const activeSession = await getUserActiveSession(userId);
    
    if (!activeSession) {
      // Se não há sessão ativa, pode ser um login antigo ou sessão expirada
      // Por segurança, vamos invalidar
      console.log(`⚠️ Sessão não encontrada para aluno ${userId} - acessando sem sessão ativa`);
      return NextResponse.json(
        { 
          error: 'Sua sessão foi invalidada. Faça login novamente.',
          sessionExpired: true
        },
        { status: 401 }
      );
    }

    // Sessão válida
    return null;
  } catch (error) {
    console.error('Erro ao validar sessão:', error);
    // Em caso de erro, não bloquear (fail open para não quebrar o sistema)
    return null;
  }
}

/**
 * Middleware para validar sessão em rotas específicas
 * Retorna true se a sessão é válida, false caso contrário
 */
export async function checkSessionValid(userId: string, sessionToken?: string): Promise<boolean> {
  try {
    if (!userId) {
      return false;
    }

    // Se não temos sessionToken, verificar se há alguma sessão ativa
    if (!sessionToken) {
      const { getUserActiveSession } = await import('./session-manager');
      const activeSession = await getUserActiveSession(userId);
      return !!activeSession;
    }

    // Verificar se a sessão específica está ativa
    return await isSessionActive(userId, sessionToken);
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return false;
  }
}

