import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FORÇANDO CRIAÇÃO DO SUPERADMIN...');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    if (!db) {
      await mongoose.disconnect();
      return NextResponse.json({ success: false, message: 'Erro de conexão' });
    }
    
    const usersCollection = db.collection('users');
    
    // Deletar superadmin existente
    console.log('🗑️ DELETANDO SUPERADMIN EXISTENTE...');
    await usersCollection.deleteMany({ role: 'superadmin' });
    
    // Criar novo superadmin
    console.log('👤 CRIANDO NOVO SUPERADMIN...');
    const hashedPassword = await bcrypt.hash('@Desbravadores@93', 12);
    
    const newSuperadmin = {
      name: 'Super Admin',
      email: 'admin@rsystem.com',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(newSuperadmin);
    
    console.log('✅ SUPERADMIN CRIADO:', {
      id: result.insertedId,
      email: newSuperadmin.email,
      hasPassword: true,
      passwordLength: hashedPassword.length
    });
    
    // Testar login imediatamente
    console.log('🔑 TESTANDO LOGIN...');
    const testUser = await usersCollection.findOne({ 
      email: 'admin@rsystem.com',
      isActive: true 
    });
    
    if (!testUser) {
      console.log('❌ ERRO: Usuário não encontrado após criação');
      await mongoose.disconnect();
      return NextResponse.json({ 
        success: false, 
        message: 'Erro: usuário não encontrado após criação' 
      });
    }
    
    const passwordMatch = await bcrypt.compare('@Desbravadores@93', testUser.password);
    console.log('🔑 RESULTADO DO TESTE:', passwordMatch);
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Superadmin criado e testado com sucesso',
      superadmin: {
        id: testUser._id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        isActive: testUser.isActive,
        hasPassword: !!testUser.password,
        passwordLength: testUser.password ? testUser.password.length : 0,
        passwordMatch: passwordMatch
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
