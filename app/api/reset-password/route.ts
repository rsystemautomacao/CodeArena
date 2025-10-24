import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import crypto from 'crypto';

// POST - Criar token de reset de senha
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

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

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Salvar token de reset no usuário
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          resetToken,
          resetExpires,
          updatedAt: new Date()
        } 
      }
    );

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`;

    return NextResponse.json({
      success: true,
      resetUrl,
      resetToken,
      message: 'Token de reset criado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao criar token de reset:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
