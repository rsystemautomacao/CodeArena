import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 TESTE DE CREDENCIAIS');
    console.log('📧 Email:', email);
    console.log('🔑 Senha recebida:', password);
    
    await connectDB();
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Erro de conexão com o banco de dados'
      });
    }
    
    const usersCollection = db.collection('users');
    
    // Buscar usuário
    const user = await usersCollection.findOne({
      email: email.toLowerCase()
    });
    
    console.log('🔍 Usuário encontrado:', user ? 'SIM' : 'NÃO');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado',
        debug: {
          email: email.toLowerCase()
        }
      });
    }
    
    console.log('🔍 Dados do usuário:', {
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordHash: user.password ? user.password.substring(0, 20) + '...' : 'AUSENTE'
    });
    
    // Verificar senha
    console.log('🔍 Verificando senha...');
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 Resultado:', passwordMatch ? 'SENHA CORRETA' : 'SENHA INCORRETA');
    
    return NextResponse.json({
      success: passwordMatch,
      message: passwordMatch ? 'Credenciais válidas' : 'Credenciais inválidas',
      debug: {
        email: email.toLowerCase(),
        userFound: true,
        passwordMatch,
        userRole: user.role,
        userActive: user.isActive,
        passwordHash: user.password ? user.password.substring(0, 20) + '...' : 'AUSENTE'
      }
    });
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      debug: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
