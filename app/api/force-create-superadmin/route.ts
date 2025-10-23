import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 FORÇANDO CRIAÇÃO DO SUPERADMIN...');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ CONEXÃO COM BANCO ESTABELECIDA');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }
    
    const usersCollection = db.collection('users');
    
    // Deletar todos os superadmins existentes
    console.log('🗑️ REMOVENDO SUPERADMINS EXISTENTES...');
    const deleteResult = await usersCollection.deleteMany({ 
      email: 'admin@rsystem.com',
      role: 'superadmin'
    });
    console.log('🗑️ SUPERADMINS REMOVIDOS:', deleteResult.deletedCount);
    
    // Criar novo superadmin
    console.log('🔧 CRIANDO NOVO SUPERADMIN...');
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
    console.log('✅ SUPERADMIN CRIADO:', result.insertedId);
    
    // Verificar se foi criado corretamente
    const createdSuperadmin = await usersCollection.findOne({ 
      email: 'admin@rsystem.com',
      role: 'superadmin'
    });
    
    if (!createdSuperadmin) {
      throw new Error('Falha ao criar superadmin');
    }
    
    console.log('✅ SUPERADMIN VERIFICADO:', {
      id: createdSuperadmin._id,
      email: createdSuperadmin.email,
      role: createdSuperadmin.role,
      hasPassword: !!createdSuperadmin.password,
      passwordLength: createdSuperadmin.password ? createdSuperadmin.password.length : 0
    });
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Superadmin criado com sucesso',
      superadmin: {
        id: createdSuperadmin._id.toString(),
        email: createdSuperadmin.email,
        name: createdSuperadmin.name,
        role: createdSuperadmin.role,
        hasPassword: !!createdSuperadmin.password,
        passwordLength: createdSuperadmin.password ? createdSuperadmin.password.length : 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.log('❌ ERRO AO CRIAR SUPERADMIN:', error);
    
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.log('⚠️ ERRO AO DESCONECTAR:', disconnectError);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 VERIFICANDO STATUS DO SUPERADMIN...');
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ CONEXÃO COM BANCO ESTABELECIDA');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }
    
    const usersCollection = db.collection('users');
    
    // Buscar superadmin
    const superadmin = await usersCollection.findOne({ 
      email: 'admin@rsystem.com',
      role: 'superadmin'
    });
    
    await mongoose.disconnect();
    
    if (superadmin) {
      return NextResponse.json({
        success: true,
        exists: true,
        superadmin: {
          id: superadmin._id.toString(),
          email: superadmin.email,
          name: superadmin.name,
          role: superadmin.role,
          isActive: superadmin.isActive,
          hasPassword: !!superadmin.password,
          passwordLength: superadmin.password ? superadmin.password.length : 0,
          createdAt: superadmin.createdAt,
          updatedAt: superadmin.updatedAt
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: true,
        exists: false,
        message: 'Superadmin não encontrado',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.log('❌ ERRO AO VERIFICAR SUPERADMIN:', error);
    
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.log('⚠️ ERRO AO DESCONECTAR:', disconnectError);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}