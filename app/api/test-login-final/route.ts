import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔐 TESTE FINAL DE LOGIN:', { email, hasPassword: !!password });
    
    // Conectar ao banco
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    if (!db) {
      await mongoose.disconnect();
      return NextResponse.json({ success: false, message: 'Erro de conexão' });
    }
    
    const usersCollection = db.collection('users');
    
    // Buscar usuário
    const user = await usersCollection.findOne({ 
      email: email,
      isActive: true 
    });
    
    if (!user) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO');
      await mongoose.disconnect();
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário não encontrado',
        debug: { email, userFound: false }
      });
    }
    
    console.log('✅ USUÁRIO ENCONTRADO:', {
      id: user._id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Verificar senha
    if (!user.password || user.password.length === 0) {
      console.log('❌ SENHA VAZIA NO BANCO');
      await mongoose.disconnect();
      return NextResponse.json({ 
        success: false, 
        message: 'Senha vazia no banco',
        debug: { 
          email: user.email,
          hasPassword: false,
          passwordLength: 0
        }
      });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 RESULTADO DA VERIFICAÇÃO:', passwordMatch);
    
    await mongoose.disconnect();
    
    if (passwordMatch) {
      console.log('✅ LOGIN SUCESSO!');
      return NextResponse.json({
        success: true,
        message: 'Login bem-sucedido',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } else {
      console.log('❌ SENHA INCORRETA');
      return NextResponse.json({
        success: false,
        message: 'Senha incorreta',
        debug: {
          email: user.email,
          hasPassword: true,
          passwordLength: user.password.length
        }
      });
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
