import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { name, email, role = 'aluno' } = await request.json();

    // Validações básicas
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar role
    if (!['aluno', 'professor'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de usuário inválido' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Criar novo usuário
    // Para alunos, não precisamos de senha pois usam Google OAuth
    // Para professores, a senha será definida quando aceitarem o convite
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      role,
      isActive: true,
      createdAt: new Date(),
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }
    });

  } catch (error: any) {
    console.error('Erro ao cadastrar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
