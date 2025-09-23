import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import connectDB from './mongodb';
import Invite from '@/models/Invite';

// Arquivo para persistir convites em desenvolvimento
const DEV_INVITES_FILE = path.join(process.cwd(), 'dev-invites.json');

// Interface para o convite
interface DevInvite {
  email: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  token: string;
}

// Função para carregar convites do arquivo
function loadDevInvites(): DevInvite[] {
  try {
    if (fs.existsSync(DEV_INVITES_FILE)) {
      const data = fs.readFileSync(DEV_INVITES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar convites do arquivo:', error);
  }
  return [];
}

// Função para salvar convites no arquivo
function saveDevInvites(invites: DevInvite[]) {
  try {
    fs.writeFileSync(DEV_INVITES_FILE, JSON.stringify(invites, null, 2));
    console.log(`🎯 [DEV] Convites salvos no arquivo: ${invites.length}`);
  } catch (error) {
    console.error('Erro ao salvar convites no arquivo:', error);
  }
}

// Função para exportar os convites (para a API)
export function getDevInviteTokens(): DevInvite[] {
  return loadDevInvites();
}

export async function generateInviteToken(): Promise<string> {
  return crypto.randomBytes(32).toString('hex');
}

export async function createInvite(email: string): Promise<string> {
  // Em modo de desenvolvimento, simular criação de convite
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [DEV] Simulando convite para: ${email}`);
    
    // Carregar convites existentes
    const existingInvites = loadDevInvites();
    
    // Verificar se já existe um convite ativo para este email
    const activeInvite = existingInvites.find(invite => 
      invite.email.toLowerCase() === email.toLowerCase() && 
      !invite.isUsed && 
      new Date(invite.expiresAt) > new Date()
    );
    
    if (activeInvite) {
      console.log(`🎯 [DEV] Convite ativo já existe para: ${email}`);
      throw new Error('Já existe um convite ativo para este email');
    }
    
    const token = await generateInviteToken();
    console.log(`🎯 [DEV] Token gerado: ${token}`);
    
    // Criar novo convite
    const newInvite: DevInvite = {
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      isUsed: false,
      token: token
    };
    
    // Adicionar à lista e salvar
    existingInvites.push(newInvite);
    saveDevInvites(existingInvites);
    
    console.log(`🎯 [DEV] Token-email salvo no arquivo: ${token} -> ${email}`);
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
    
    // Carregar convites do arquivo
    const invites = loadDevInvites();
    const inviteData = invites.find(invite => invite.token === token);
    
    if (inviteData) {
      // Verificar se não expirou
      const expiresAt = new Date(inviteData.expiresAt);
      if (expiresAt < new Date()) {
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
    
    // Carregar convites do arquivo
    const invites = loadDevInvites();
    const inviteIndex = invites.findIndex(invite => invite.token === token);
    
    if (inviteIndex !== -1) {
      // Marcar como usado e salvar
      invites[inviteIndex].isUsed = true;
      saveDevInvites(invites);
      console.log(`🎯 [DEV] Convite marcado como usado no arquivo: ${token}`);
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

export async function deleteInvite(token: string): Promise<boolean> {
  // Em modo de desenvolvimento, simular exclusão
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 [DEV] Excluindo convite: ${token}`);
    
    // Carregar convites do arquivo
    const invites = loadDevInvites();
    const initialLength = invites.length;
    
    // Filtrar removendo o convite com o token
    const updatedInvites = invites.filter(invite => invite.token !== token);
    
    if (updatedInvites.length < initialLength) {
      // Salvar lista atualizada
      saveDevInvites(updatedInvites);
      console.log(`🎯 [DEV] Convite excluído do arquivo: ${token}`);
      return true;
    }
    
    console.log(`🎯 [DEV] Convite não encontrado para exclusão: ${token}`);
    return false;
  }

  // Em produção, usar banco de dados real
  await connectDB();

  const result = await Invite.findOneAndDelete({ token });
  return !!result;
}
