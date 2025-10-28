import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { markInviteAsUsed } from '@/lib/invite';

export async function POST(request: NextRequest) {
  try {
    const { email, password, inviteToken } = await request.json();

    if (!email || !password || !inviteToken) {
      return NextResponse.json(
        { success: false, error: 'Email, senha e token são obrigatórios' },
        { status: 400 }
      );
    }

    // Em desenvolvimento, simular criação
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 [API] Criando conta de professor para: ${email}`);
      
      // Verificar se o convite é válido
      const { validateInvite } = await import('@/lib/invite');
      const inviteValidation = await validateInvite(inviteToken);
      
      if (!inviteValidation.valid) {
        return NextResponse.json(
          { success: false, error: inviteValidation.error || 'Convite inválido' },
          { status: 400 }
        );
      }

      // Verificar se o email do convite corresponde
      if (inviteValidation.email !== email.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: 'Email não corresponde ao convite' },
          { status: 400 }
        );
      }

      // Simular criação de usuário (em desenvolvimento, não salva no banco)
      console.log(`🎯 [DEV] Simulando criação de professor: ${email}`);
      
      // Marcar convite como usado
      await markInviteAsUsed(inviteToken);
      
      return NextResponse.json({
        success: true,
        message: 'Conta de professor criada com sucesso (desenvolvimento)',
        user: {
          email,
          role: 'professor',
          isActive: true
        }
      });
    }

    // Em produção, usar banco de dados real
    await connectDB();

    // Verificar se o convite é válido
    const { validateInvite } = await import('@/lib/invite');
    const inviteValidation = await validateInvite(inviteToken);
    
    if (!inviteValidation.valid) {
      return NextResponse.json(
        { success: false, error: inviteValidation.error || 'Convite inválido' },
        { status: 400 }
      );
    }

    // Verificar se o email do convite corresponde
    if (inviteValidation.email !== email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Email não corresponde ao convite' },
        { status: 400 }
      );
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // Se o usuário já existe, atualizar a senha e reativar
      console.log('🔍 Usuário existente encontrado - atualizando senha');
      console.log('🔍 ID do usuário:', existingUser._id);
      console.log('🔍 Email:', existingUser.email);
      console.log('🔍 Role:', existingUser.role);
      console.log('🔍 Senha atual (hash):', existingUser.password ? existingUser.password.substring(0, 20) + '...' : 'AUSENTE');
      
      // Criptografar nova senha
      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('🔍 Nova senha (hash):', hashedPassword.substring(0, 20) + '...');
      
      // Atualizar usuário existente
      const updatedUser = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          password: hashedPassword,
          isActive: true,
          updatedAt: new Date()
        },
        { new: true }
      );
      
      console.log('✅ Usuário atualizado:', updatedUser ? 'SIM' : 'NÃO');
      console.log('🔍 Senha após update (hash):', updatedUser.password ? updatedUser.password.substring(0, 20) + '...' : 'AUSENTE');
      
      // Verificar se a senha foi realmente atualizada
      const verifyUser = await User.findOne({ email: email.toLowerCase() });
      console.log('🔍 Verificação - Senha no banco (hash):', verifyUser.password ? verifyUser.password.substring(0, 20) + '...' : 'AUSENTE');
      
      // Testar se a nova senha funciona
      const passwordMatch = await bcrypt.compare(password, verifyUser.password);
      console.log('🔍 Senha funciona?', passwordMatch ? 'SIM' : 'NÃO');
      
      // Marcar convite como usado
      await markInviteAsUsed(inviteToken);
      
      return NextResponse.json({
        success: true,
        message: 'Senha do professor atualizada com sucesso',
        user: {
          id: existingUser._id,
          email: existingUser.email,
          role: existingUser.role,
          isActive: true
        }
      });
    }

    // Se não existe, criar novo usuário
    // Criptografar senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await User.create({
      name: email.split('@')[0], // Usar parte do email como nome
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'professor',
      isActive: true,
    });

    // Marcar convite como usado
    await markInviteAsUsed(inviteToken);

    return NextResponse.json({
      success: true,
      message: 'Conta de professor criada com sucesso',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error: any) {
    console.error('Erro ao criar conta de professor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
