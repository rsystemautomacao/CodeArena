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
    await connectDB();
    const invites = await Invite.find({})
      .sort({ createdAt: -1 })
      .lean();

    const formattedInvites = invites.map(invite => ({
      id: (invite._id as any).toString(),
      email: invite.email,
      token: invite.token,
      inviteUrl: `${process.env.NEXTAUTH_URL}/auth/invite/${invite.token}`,
      createdAt: invite.createdAt.toISOString(),
      isUsed: invite.isUsed,
      isActive: !invite.isUsed && new Date(invite.expiresAt).getTime() > new Date().getTime()
    }));

    return NextResponse.json({
      success: true,
      invites: formattedInvites
    });

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

    const { createInvite } = await import('@/lib/invite');
    const token = await createInvite(email);
    const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/invite/${token}`;

    return NextResponse.json({
      success: true,
      inviteUrl,
      token
    });

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
    
    const result = await Invite.findOneAndDelete({ token });
    
    if (result) {
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

  } catch (error: any) {
    console.error('Erro ao excluir convite:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}