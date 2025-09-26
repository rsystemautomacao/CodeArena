const mongoose = require('mongoose');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:@Desbravadores@93@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';

// Esquemas necessários
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['superadmin', 'professor', 'aluno'] 
  },
  isActive: { type: Boolean, default: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  role: { type: String, default: 'professor' },
  isUsed: { type: Boolean, default: false },
  usedAt: { type: Date },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }
});

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  code: { type: String, required: true, unique: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  input: { type: String },
  expectedOutput: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['facil', 'medio', 'dificil'], 
    default: 'facil' 
  },
  timeLimit: { type: Number, default: 1000 }, // em ms
  memoryLimit: { type: Number, default: 128 }, // em MB
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const submissionSchema = new mongoose.Schema({
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compile_error'],
    default: 'pending'
  },
  result: { type: String },
  executionTime: { type: Number },
  memoryUsed: { type: Number },
  judge0SubmissionId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

async function setupMongoDB() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB Atlas');

    // Criar database se não existir
    const db = mongoose.connection.db;
    const dbName = 'codearena';
    
    console.log('📁 Verificando database:', dbName);
    
    // Listar databases existentes
    const databases = await db.admin().listDatabases();
    console.log('📋 Databases existentes:', databases.databases.map(d => d.name));

    // Criar collections se não existirem
    const collections = ['users', 'invites', 'classrooms', 'exercises', 'submissions'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Collection '${collectionName}' criada`);
      } catch (error) {
        if (error.code === 48) { // Collection already exists
          console.log(`ℹ️ Collection '${collectionName}' já existe`);
        } else {
          console.error(`❌ Erro ao criar collection '${collectionName}':`, error.message);
        }
      }
    }

    // Criar índices necessários
    console.log('🔍 Criando índices...');
    
    const User = mongoose.model('User', userSchema);
    const Invite = mongoose.model('Invite', inviteSchema);
    
    // Índices para User
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });
    console.log('✅ Índices da collection User criados');

    // Índices para Invite
    await Invite.collection.createIndex({ token: 1 }, { unique: true });
    await Invite.collection.createIndex({ email: 1 });
    await Invite.collection.createIndex({ expiresAt: 1 });
    console.log('✅ Índices da collection Invite criados');

    // Verificar se superadmin já existe
    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    
    if (!existingSuperadmin) {
      console.log('👑 Criando superadmin...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('@Desbravadores@93', 12);
      
      const superadmin = new User({
        name: 'Super Admin',
        email: 'admin@rsystem.com',
        password: hashedPassword,
        role: 'superadmin',
        isActive: true
      });
      
      await superadmin.save();
      console.log('✅ Superadmin criado com sucesso');
      console.log('📧 Email: admin@rsystem.com');
      console.log('🔑 Senha: @Desbravadores@93');
    } else {
      console.log('ℹ️ Superadmin já existe');
    }

    // Listar collections finais
    const finalCollections = await db.listCollections().toArray();
    console.log('📋 Collections finais:');
    finalCollections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Contar documentos em cada collection
    console.log('📊 Contagem de documentos:');
    for (const collectionName of collections) {
      try {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`  - ${collectionName}: ${count} documentos`);
      } catch (error) {
        console.log(`  - ${collectionName}: erro ao contar`);
      }
    }

    console.log('🎉 Setup do MongoDB concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no setup do MongoDB:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupMongoDB()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { setupMongoDB };
