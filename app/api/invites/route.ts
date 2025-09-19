import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createInvite } from '@/lib/invite';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 [API] Iniciando criação de convite...');
    
    const session = await getServerSession(authOptions);
    console.log('🎯 [API] Sessão:', session ? 'Encontrada' : 'Não encontrada');

    if (!session || session.user.role !== 'superadmin') {
      console.log('🎯 [API] Acesso negado - Role:', session?.user?.role);
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('🎯 [API] Body recebido:', body);
    
    const { email } = body;

    if (!email) {
      console.log('🎯 [API] Email não fornecido');
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🎯 [API] Criando convite para:', email);
    const token = await createInvite(email);
    const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/invite/${token}`;

    console.log('🎯 [API] Convite criado com sucesso:', inviteUrl);

    return NextResponse.json({
      success: true,
      inviteUrl,
      message: 'Convite criado com sucesso',
    });
  } catch (error: any) {
    console.error('🎯 [API] Erro ao criar convite:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
