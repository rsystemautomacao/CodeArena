const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Configurações diretas
const MONGODB_URI = 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
const SUPERADMIN_EMAIL = 'admin@rsystem.com';
const SUPERADMIN_PASSWORD = '@Desbravadores@93';

// Schema do User
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
  },
  role: {
    type: String,
    enum: ['superadmin', 'professor', 'aluno'],
    required: [true, 'Papel do usuário é obrigatório'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createSuperAdmin() {
  try {
    console.log('🔧 CRIANDO SUPERADMIN...');
    console.log('📧 Email:', SUPERADMIN_EMAIL);
    console.log('🔑 Senha:', SUPERADMIN_PASSWORD);

    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ CONECTADO AO MONGODB');

    // Verificar se já existe
    const existingSuperadmin = await User.findOne({ email: SUPERADMIN_EMAIL });
    
    if (existingSuperadmin) {
      console.log('⚠️ SUPERADMIN JÁ EXISTE, ATUALIZANDO...');
      
      // Atualizar senha e role
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);
      
      await User.findByIdAndUpdate(existingSuperadmin._id, {
        role: 'superadmin',
        password: hashedPassword,
        isActive: true,
        name: 'Super Admin',
        updatedAt: new Date()
      });
      
      console.log('✅ SUPERADMIN ATUALIZADO COM SUCESSO');
    } else {
      console.log('✅ CRIANDO NOVO SUPERADMIN...');
      
      const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);
      
      const superadmin = await User.create({
        name: 'Super Admin',
        email: SUPERADMIN_EMAIL,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true
      });
      
      console.log('🎉 SUPERADMIN CRIADO COM SUCESSO!');
      console.log('🆔 ID:', superadmin._id);
    }

    // Verificar se funcionou
    const testSuperadmin = await User.findOne({ email: SUPERADMIN_EMAIL });
    const passwordMatch = await bcrypt.compare(SUPERADMIN_PASSWORD, testSuperadmin.password);
    
    console.log('🧪 TESTE FINAL:', {
      encontrado: !!testSuperadmin,
      email: testSuperadmin?.email,
      role: testSuperadmin?.role,
      isActive: testSuperadmin?.isActive,
      senhaCorreta: passwordMatch
    });

    if (passwordMatch) {
      console.log('🎉 SUCESSO! Superadmin criado e senha funcionando!');
    } else {
      console.log('❌ ERRO! Senha não confere');
    }

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 DESCONECTADO DO MONGODB');
    process.exit(0);
  }
}

createSuperAdmin();
