import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

// DELETE - Excluir usuário
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
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    await connectDB();
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    const usersCollection = db.collection('users');
    
    // Verificar se o usuário existe
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase() 
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Excluir usuário
    await usersCollection.deleteOne({ _id: user._id });

    // Também excluir convites relacionados
    const Invite = await import('@/models/Invite');
    await Invite.default.deleteMany({ email: email.toLowerCase() });

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
