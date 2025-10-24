import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({
        valid: false,
        error: 'Token não fornecido'
      });
    }

    await connectDB();
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({
        valid: false,
        error: 'Erro de conexão com o banco de dados'
      });
    }
    
    const usersCollection = db.collection('users');
    
    // Buscar usuário pelo token de reset
    const user = await usersCollection.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({
        valid: false,
        error: 'Token de reset inválido ou expirado'
      });
    }

    return NextResponse.json({
      valid: true,
      email: user.email
    });

  } catch (error) {
    console.error('Erro ao validar token de reset:', error);
    return NextResponse.json({
      valid: false,
      error: 'Erro interno do servidor'
    });
  }
}
