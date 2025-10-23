import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 GARANTINDO SUPERADMIN...');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    if (!db) {
      await mongoose.disconnect();
      return NextResponse.json({ success: false, message: 'Erro de conexão' });
    }
    
    const usersCollection = db.collection('users');
    
    // DELETAR TODOS OS SUPERADMINS EXISTENTES
    console.log('🗑️ DELETANDO SUPERADMINS EXISTENTES...');
    await usersCollection.deleteMany({ 
      email: 'admin@rsystem.com',
      role: 'superadmin'
    });
    
    // CRIAR NOVO SUPERADMIN COM ROLE CORRETO
    console.log('👤 CRIANDO SUPERADMIN DEFINITIVO...');
    const hashedPassword = await bcrypt.hash('@Desbravadores@93', 12);
    
    const superadmin = {
      name: 'Super Admin',
      email: 'admin@rsystem.com',
      password: hashedPassword,
      role: 'superadmin', // ROLE EXPLÍCITO
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(superadmin);
    console.log('✅ SUPERADMIN CRIADO:', result.insertedId);
    
    // VERIFICAR SE FOI CRIADO CORRETAMENTE
    const createdSuperadmin = await usersCollection.findOne({ 
      email: 'admin@rsystem.com',
      role: 'superadmin'
    });
    
    if (!createdSuperadmin) {
      console.log('❌ ERRO: Superadmin não foi criado');
      await mongoose.disconnect();
      return NextResponse.json({ 
        success: false, 
        message: 'Erro ao criar superadmin' 
      });
    }
    
    // TESTAR LOGIN IMEDIATAMENTE
    console.log('🔑 TESTANDO LOGIN...');
    const passwordMatch = await bcrypt.compare('@Desbravadores@93', createdSuperadmin.password);
    console.log('🔑 RESULTADO DO TESTE:', passwordMatch);
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Superadmin garantido com sucesso',
      superadmin: {
        id: createdSuperadmin._id,
        email: createdSuperadmin.email,
        name: createdSuperadmin.name,
        role: createdSuperadmin.role,
        isActive: createdSuperadmin.isActive,
        hasPassword: !!createdSuperadmin.password,
        passwordLength: createdSuperadmin.password ? createdSuperadmin.password.length : 0,
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
