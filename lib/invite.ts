import crypto from 'crypto';
import connectDB from './mongodb';
import Invite from '@/models/Invite';

export async function generateInviteToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}

export async function createInvite(email: string): Promise<string> {
  // Em modo de desenvolvimento, simular criação de convite
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [DEV] Simulando convite para: ${email}`);
    const token = await generateInviteToken();
    console.log(`🎯 [DEV] Token gerado: ${token}`);
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
    // Em desenvolvimento, sempre validar como verdadeiro
    // O email será definido pelo usuário no login
    return { 
      valid: true, 
      email: 'professor@convite.com' 
    };
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
