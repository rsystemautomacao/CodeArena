import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔐 TESTE DIRETO DE LOGIN:', {
      email,
      hasPassword: !!password,
      timestamp: new Date().toISOString()
    });

    // Conectar ao banco
    await connectDB();
    console.log('✅ CONECTADO AO MONGODB');

    // Buscar usuário
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO:', email);
      return NextResponse.json({
        success: false,
        message: 'Usuário não encontrado',
        email
      }, { status: 404 });
    }

    console.log('👤 USUÁRIO ENCONTRADO:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0
    });

    // Verificar senha
    let passwordMatch = false;
    if (user.password && user.password.length > 0) {
      try {
        passwordMatch = await bcrypt.compare(password, user.password);
        console.log('🔑 VERIFICAÇÃO DE SENHA:', { passwordMatch });
      } catch (error) {
        console.log('❌ ERRO AO COMPARAR SENHA:', error);
        return NextResponse.json({
          success: false,
          message: 'Erro ao verificar senha',
          error: error.message
        }, { status: 500 });
      }
    } else {
      console.log('❌ SENHA VAZIA OU INEXISTENTE');
      return NextResponse.json({
        success: false,
        message: 'Usuário sem senha configurada',
        email
      }, { status: 401 });
    }

    if (!passwordMatch) {
      console.log('❌ SENHA INCORRETA');
      return NextResponse.json({
        success: false,
        message: 'Senha incorreta',
        email
      }, { status: 401 });
    }

    if (!user.isActive) {
      console.log('❌ USUÁRIO INATIVO');
      return NextResponse.json({
        success: false,
        message: 'Usuário inativo',
        email
      }, { status: 401 });
    }

    console.log('✅ LOGIN BEM-SUCEDIDO:', {
      id: user._id,
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      success: true,
      message: 'Login bem-sucedido',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error: any) {
    console.error('❌ ERRO NO TESTE DE LOGIN:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    }, { status: 500 });
  }
}
