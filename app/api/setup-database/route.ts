import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    console.log('🔧 INICIANDO SETUP DO BANCO DE DADOS...');
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:@Desbravadores@93@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const db = mongoose.connection.db;
    
    // Criar collections
    const collections = ['users', 'invites', 'classrooms', 'exercises', 'submissions'];
    const createdCollections = [];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        createdCollections.push(`${collectionName} - criada`);
        console.log(`✅ Collection '${collectionName}' criada`);
      } catch (error: any) {
        if (error.code === 48) {
          createdCollections.push(`${collectionName} - já existe`);
          console.log(`ℹ️ Collection '${collectionName}' já existe`);
        } else {
          createdCollections.push(`${collectionName} - erro: ${error.message}`);
          console.error(`❌ Erro: ${error.message}`);
        }
      }
    }

    // Criar superadmin
    const usersCollection = db.collection('users');
    const existingSuperadmin = await usersCollection.findOne({ role: 'superadmin' });
    
    let superadminStatus = '';
    if (!existingSuperadmin) {
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
      
      await usersCollection.insertOne(superadmin);
      superadminStatus = 'Superadmin criado com sucesso';
      console.log('✅ Superadmin criado!');
    } else {
      superadminStatus = 'Superadmin já existe';
      console.log('ℹ️ Superadmin já existe');
    }

    // Criar índices
    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      await usersCollection.createIndex({ role: 1 });
      console.log('✅ Índices criados');
    } catch (error: any) {
      console.log('ℹ️ Índices já existem ou erro:', error.message);
    }

    await mongoose.disconnect();
    console.log('🔌 Desconectado');

    return NextResponse.json({
      success: true,
      message: 'Setup do banco de dados concluído com sucesso',
      details: {
        collections: createdCollections,
        superadmin: superadminStatus,
        email: 'admin@rsystem.com',
        password: '@Desbravadores@93'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERRO NO SETUP DO BANCO:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro no setup do banco de dados',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
