import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔐 LOGIN DIRETO:', { email, hasPassword: !!password });
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    // Conectar ao banco
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.log('❌ MONGODB_URI não configurado');
      return NextResponse.json({ 
        success: false, 
        message: 'Configuração de banco não encontrada' 
      });
    }
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    if (!db) {
      await mongoose.disconnect();
      return NextResponse.json({ success: false, message: 'Erro de conexão' });
    }
    
    const usersCollection = db.collection('users');
    
    // FORÇAR CRIAÇÃO DO SUPERADMIN SE NECESSÁRIO
    if (email === 'admin@rsystem.com') {
      console.log('🔧 GARANTINDO SUPERADMIN...');
      
      // Deletar superadmin existente
      await usersCollection.deleteMany({ 
        email: 'admin@rsystem.com',
        role: 'superadmin'
      });
      
      // Criar novo superadmin
      const hashedPassword = await bcrypt.hash('@Desbravadores@93', 12);
      const superadmin = {
        name: 'Super Admin',
        email: 'admin@rsystem.com',
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(superadmin);
      console.log('✅ SUPERADMIN CRIADO:', result.insertedId);
    }
    
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
        message: 'Usuário não encontrado' 
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
        message: 'Senha não configurada' 
      });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔑 RESULTADO DA VERIFICAÇÃO:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('❌ SENHA INCORRETA');
      await mongoose.disconnect();
      return NextResponse.json({
        success: false,
        message: 'Senha incorreta'
      });
    }
    
    // CRIAR JWT TOKEN
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '7d' }
    );
    
    console.log('✅ LOGIN SUCESSO!');
    console.log('🎫 TOKEN CRIADO:', token.substring(0, 20) + '...');
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Login bem-sucedido',
      token: token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      }
    });
    
  } catch (error) {
    console.log('❌ ERRO:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
