import crypto from 'crypto';
import connectDB from './mongodb';
import Invite from '@/models/Invite';

// Map para armazenar tokens em desenvolvimento (em memória)
const devInviteTokens = new Map<string, {
  email: string;
  createdAt: Date;
  expiresAt: Date;
  isUsed: boolean;
}>();

export async function generateInviteToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}

export async function createInvite(email: string): Promise<string> {
  // Em modo de desenvolvimento, simular criação de convite
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [DEV] Simulando convite para: ${email}`);
    const token = await generateInviteToken();
    console.log(`🎯 [DEV] Token gerado: ${token}`);
    
    // Salvar no Map em memória
    devInviteTokens.set(token, {
      email: email.toLowerCase(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      isUsed: false
    });
    
    console.log(`🎯 [DEV] Token-email salvo em memória: ${token} -> ${email}`);
    return token;
  }

  // Em produção, usar banco de dados real
  await connectDB();

  // Verificar se já existe um convite ativo para este email
  const existingInvite = await Invite.findOne({
    email: email.toLowerCase(),
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (existingInvite) {
    throw new Error('Já existe um convite ativo para este email');
  }

  const token = await generateInviteToken();
  
  const invite = await Invite.create({
    email: email.toLowerCase(),
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
    isUsed: false,
  });

  return token;
}

export async function validateInvite(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
  // Em modo de desenvolvimento, simular validação
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [DEV] Validando token: ${token}`);
    
    // Buscar no Map em memória
    const inviteData = devInviteTokens.get(token);
    
    if (inviteData) {
      // Verificar se não expirou
      if (inviteData.expiresAt < new Date()) {
        return { valid: false, error: 'Este convite expirou' };
      }
      
      // Verificar se não foi usado
      if (inviteData.isUsed) {
        return { valid: false, error: 'Este convite já foi utilizado' };
      }
      
      console.log(`🎯 [DEV] Token válido encontrado: ${token} -> ${inviteData.email}`);
      return { 
        valid: true, 
        email: inviteData.email 
      };
    }
    
    // Se não encontrou o token, retornar erro
    return { valid: false, error: 'Convite não encontrado' };
  }

  // Em produção, usar banco de dados real
  await connectDB();

  const invite = await Invite.findOne({ token });

  if (!invite) {
    return { valid: false, error: 'Convite não encontrado' };
  }

  if (invite.isUsed) {
    return { valid: false, error: 'Este convite já foi utilizado' };
  }

  if (invite.expiresAt < new Date()) {
    return { valid: false, error: 'Este convite expirou' };
  }

  return { valid: true, email: invite.email };
}

export async function markInviteAsUsed(token: string): Promise<void> {
  // Em modo de desenvolvimento, simular marcação como usado
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [DEV] Marcando convite como usado: ${token}`);
    
    // Marcar como usado no Map em memória
    const inviteData = devInviteTokens.get(token);
    if (inviteData) {
      inviteData.isUsed = true;
      devInviteTokens.set(token, inviteData);
      console.log(`🎯 [DEV] Convite marcado como usado em memória: ${token}`);
    }
    
    return;
  }

  // Em produção, usar banco de dados real
  await connectDB();

  await Invite.findOneAndUpdate(
    { token },
    {
      isUsed: true,
      usedAt: new Date(),
    }
  );
}
