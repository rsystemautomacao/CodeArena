/**
 * Gerenciador de sessões para controle de acesso único
 * Impede que alunos façam login simultâneo em múltiplos locais
 */

import connectDB from './mongodb';
import mongoose from 'mongoose';
import Session from '@/models/Session';
import { getClientIP } from './ip-validation';

/**
 * Invalidar todas as sessões ativas de um usuário (exceto a atual se especificada)
 */
export async function invalidateUserSessions(
  userId: string,
  excludeSessionToken?: string
): Promise<number> {
  try {
    await connectDB();
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const query: any = {
      userId: userObjectId,
      isActive: true,
    };
    
    if (excludeSessionToken) {
      query.sessionToken = { $ne: excludeSessionToken };
    }
    
    const result = await Session.updateMany(
      query,
      { 
        isActive: false,
        updatedAt: new Date(),
      }
    );
    
    console.log(`🔒 Sessões invalidadas para usuário ${userId}:`, result.modifiedCount);
    return result.modifiedCount || 0;
  } catch (error) {
    console.error('Erro ao invalidar sessões:', error);
    return 0;
  }
}

/**
 * Criar uma nova sessão ativa para um usuário
 */
export async function createUserSession(
  userId: string,
  sessionToken: string,
  request?: Request | { headers: Headers | { get: (key: string) => string | null }, url?: string }
): Promise<boolean> {
  try {
    await connectDB();
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Obter IP e User Agent se disponível
    let ipAddress: string | undefined;
    let userAgent: string | undefined;
    
    if (request) {
      ipAddress = getClientIP(request);
      const headers = request.headers as Headers;
      userAgent = headers.get('user-agent') || undefined;
    }
    
    // Criar nova sessão
    await Session.create({
      userId: userObjectId,
      sessionToken,
      ipAddress,
      userAgent,
      isActive: true,
      lastActivity: new Date(),
    });
    
    console.log(`✅ Nova sessão criada para usuário ${userId}`, {
      sessionToken: sessionToken.substring(0, 20) + '...',
      ipAddress,
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return false;
  }
}

/**
 * Verificar se uma sessão está ativa
 */
export async function isSessionActive(
  userId: string,
  sessionToken: string
): Promise<boolean> {
  try {
    await connectDB();
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const session = await Session.findOne({
      userId: userObjectId,
      sessionToken,
      isActive: true,
    });
    
    if (session) {
      // Atualizar última atividade
      await Session.findByIdAndUpdate(session._id, {
        lastActivity: new Date(),
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return false;
  }
}

/**
 * Invalidar uma sessão específica
 */
export async function invalidateSession(sessionToken: string): Promise<boolean> {
  try {
    await connectDB();
    
    await Session.updateOne(
      { sessionToken },
      { 
        isActive: false,
        updatedAt: new Date(),
      }
    );
    
    return true;
  } catch (error) {
    console.error('Erro ao invalidar sessão:', error);
    return false;
  }
}

/**
 * Obter informações da sessão ativa de um usuário
 */
export async function getUserActiveSession(userId: string): Promise<{
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  lastActivity: Date;
} | null> {
  try {
    await connectDB();
    
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    const session = await Session.findOne({
      userId: userObjectId,
      isActive: true,
    }).sort({ lastActivity: -1 });
    
    if (!session) {
      return null;
    }
    
    return {
      sessionToken: session.sessionToken,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastActivity: session.lastActivity,
    };
  } catch (error) {
    console.error('Erro ao buscar sessão ativa:', error);
    return null;
  }
}

