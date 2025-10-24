import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Invite from '@/models/Invite';

// GET - Listar convites (apenas para superadmin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Em desenvolvimento, retornar convites do Map em memória
    if (process.env.NODE_ENV === 'development') {
      // Importar o Map de convites
      const { getDevInviteTokens } = await import('@/lib/invite');
      const devInvites = getDevInviteTokens();
      
      const formattedInvites = devInvites.map((invite, index) => ({
        id: `dev-${index}`,
        email: invite.email,
        token: invite.token,
        inviteUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/invite/${invite.token}`,
        createdAt: invite.createdAt, // Já é string ISO
        isUsed: invite.isUsed,
        isActive: !invite.isUsed && new Date(invite.expiresAt).getTime() > new Date().getTime()
      }));

      return NextResponse.json({
        success: true,
        invites: formattedInvites,
        message: 'Convites carregados do servidor (desenvolvimento)'
      });
    }

    // Em produção, buscar do banco de dados
    try {
      await connectDB();
      const invites = await Invite.find({})
        .sort({ createdAt: -1 })
        .lean();

      // Buscar informações dos usuários para cada convite
      const mongoose = await import('mongoose');
      const usersCollection = mongoose.connection.db.collection('users');
      
      const formattedInvites = await Promise.all(invites.map(async (invite: any) => {
        const user = await usersCollection.findOne({ email: invite.email });
        
        return {
          id: String(invite._id),
          email: invite.email,
          token: invite.token,
          inviteUrl: `${process.env.NEXTAUTH_URL}/auth/invite/${invite.token}`,
          createdAt: invite.createdAt.toISOString(),
          isUsed: invite.isUsed,
          isActive: !invite.isUsed && new Date(invite.expiresAt).getTime() > new Date().getTime(),
          userStatus: user ? {
            exists: true,
            role: user.role,
            isActive: user.isActive,
            lastLogin: user.lastLogin
          } : {
            exists: false,
            role: null,
            isActive: false,
            lastLogin: null
          }
        };
      }));

      return NextResponse.json({
        success: true,
        invites: formattedInvites
      });
    } catch (dbError) {
      console.error('Erro ao conectar com banco:', dbError);
      // Fallback: retornar lista vazia se banco falhar
      return NextResponse.json({
        success: true,
        invites: [],
        message: 'Banco de dados temporariamente indisponível'
      });
    }

  } catch (error: any) {
    console.error('Erro ao listar convites:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar convite (apenas para superadmin)
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [API] Iniciando criação de convite...');
    
    const session = await getServerSession(authOptions);
    console.log('🎯 [API] Sessão:', session ? 'Encontrada' : 'Não encontrada');
    
    if (!session || session.user?.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('🎯 [API] Body recebido:', body);
    
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🎯 [API] Criando convite para:', email);

    // Em desenvolvimento, simular criação
    if (process.env.NODE_ENV === 'development') {
      const { createInvite } = await import('@/lib/invite');
      const token = await createInvite(email);
      const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/invite/${token}`;
      
      console.log('🎯 [API] Convite criado com sucesso:', inviteUrl);
      
      return NextResponse.json({
        success: true,
        inviteUrl,
        token
      });
    }

    // Em produção, usar banco de dados
    try {
      await connectDB();
      
      // Verificar se já existe um convite ativo para este email
      const existingInvite = await Invite.findOne({
        email: email.toLowerCase(),
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (existingInvite) {
        return NextResponse.json(
          { success: false, error: 'Já existe um convite ativo para este email' },
          { status: 400 }
        );
      }

      // Verificar se o usuário já existe no banco
      const mongoose = await import('mongoose');
      const usersCollection = mongoose.connection.db.collection('users');
      const existingUser = await usersCollection.findOne({ 
        email: email.toLowerCase() 
      });

      if (existingUser) {
        if (existingUser.role === 'professor' && existingUser.isActive) {
          return NextResponse.json(
            { success: false, error: 'Este professor já está ativo. Use a opção de reset de senha.' },
            { status: 400 }
          );
        } else if (existingUser.role === 'professor' && !existingUser.isActive) {
          // Usuário existe mas está inativo, reativar
          await usersCollection.updateOne(
            { _id: existingUser._id },
            { $set: { isActive: true, updatedAt: new Date() } }
          );
          
          // Criar novo convite
          const { createInvite } = await import('@/lib/invite');
          const token = await createInvite(email);
          const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/invite/${token}`;

          return NextResponse.json({
            success: true,
            inviteUrl,
            token,
            message: 'Professor reativado com sucesso'
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Este email já está cadastrado como aluno. Use a opção de reset de senha.' },
            { status: 400 }
          );
        }
      }

      const { createInvite } = await import('@/lib/invite');
      const token = await createInvite(email);
      const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/invite/${token}`;

      return NextResponse.json({
        success: true,
        inviteUrl,
        token
      });
    } catch (dbError) {
      console.error('Erro ao conectar com banco para criar convite:', dbError);
      // Fallback: usar sistema de desenvolvimento
      const { createInvite } = await import('@/lib/invite');
      const token = await createInvite(email);
      const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/invite/${token}`;
      
      return NextResponse.json({
        success: true,
        inviteUrl,
        token,
        message: 'Convite criado em modo fallback'
      });
    }

  } catch (error: any) {
    console.error('Erro ao criar convite:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir convite (apenas para superadmin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`🎯 [API] Excluindo convite com token: ${token}`);

    // Em desenvolvimento, usar função de exclusão do arquivo
    if (process.env.NODE_ENV === 'development') {
      const { deleteInvite } = await import('@/lib/invite');
      const deleted = await deleteInvite(token);
      
      if (deleted) {
        console.log(`🎯 [API] Convite excluído com sucesso: ${token}`);
        return NextResponse.json({
          success: true,
          message: 'Convite excluído com sucesso'
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Convite não encontrado' },
          { status: 404 }
        );
      }
    }

    // Em produção, usar banco de dados
    await connectDB();
    
    // Buscar o convite primeiro para obter o email
    const invite = await Invite.findOne({ token });
    
    if (!invite) {
      return NextResponse.json(
        { success: false, error: 'Convite não encontrado' },
        { status: 404 }
      );
    }

    // Excluir o convite
    await Invite.findOneAndDelete({ token });

    // Verificar se o usuário existe e excluí-lo também
    const mongoose = await import('mongoose');
    const usersCollection = mongoose.connection.db.collection('users');
    const user = await usersCollection.findOne({ email: invite.email });
    
    if (user) {
      await usersCollection.deleteOne({ _id: user._id });
      console.log(`🎯 [API] Usuário excluído: ${invite.email}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Convite e usuário excluídos com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao excluir convite:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}