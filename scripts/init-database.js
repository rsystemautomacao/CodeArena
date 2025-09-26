const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🚀 Iniciando configuração do banco de dados...');
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    console.log('🔌 Conectando ao MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado com sucesso!');

    const db = mongoose.connection.db;
    
    // 1. Criar database 'codearena' se não existir
    console.log('📁 Configurando database...');
    
    // 2. Criar collections
    const collections = ['users', 'invites', 'classrooms', 'exercises', 'submissions'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Collection '${collectionName}' criada`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️ Collection '${collectionName}' já existe`);
        } else {
          console.error(`❌ Erro: ${error.message}`);
        }
      }
    }

    // 3. Criar superadmin
    console.log('👑 Configurando superadmin...');
    
    const usersCollection = db.collection('users');
    
    // Verificar se já existe
    const existingSuperadmin = await usersCollection.findOne({ role: 'superadmin' });
    
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
      console.log('✅ Superadmin criado!');
      console.log('📧 Email: admin@rsystem.com');
      console.log('🔑 Senha: @Desbravadores@93');
    } else {
      console.log('ℹ️ Superadmin já existe');
    }

    // 4. Criar índices
    console.log('🔍 Criando índices...');
    
    try {
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      await usersCollection.createIndex({ role: 1 });
      console.log('✅ Índices da collection users criados');
    } catch (error) {
      console.log('ℹ️ Índices já existem ou erro:', error.message);
    }

    // 5. Verificar resultado
    console.log('📊 Verificando configuração...');
    
    const collectionsList = await db.listCollections().toArray();
    console.log('📋 Collections disponíveis:');
    collectionsList.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    const userCount = await usersCollection.countDocuments();
    console.log(`👥 Total de usuários: ${userCount}`);

    console.log('🎉 Banco de dados configurado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  }
}

// Executar
initDatabase()
  .then(() => {
    console.log('✅ Configuração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na configuração:', error);
    process.exit(1);
  });
