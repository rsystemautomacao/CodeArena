import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Senha é obrigatória' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres' },
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
    
    // Buscar usuário pelo token de reset
    const user = await usersCollection.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token de reset inválido ou expirado' },
        { status: 400 }
      );
    }

    // Criptografar nova senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atualizar senha e limpar token de reset
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetToken: 1,
          resetExpires: 1
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
