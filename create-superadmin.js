const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

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
  image: {
    type: String,
  },
  avatar: {
    type: String,
  },
  phone: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
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
    console.log('📋 CONFIGURAÇÕES:', {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADO' : 'NÃO CONFIGURADO',
      SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
      SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'NÃO CONFIGURADO'
    });

    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ CONECTADO AO MONGODB');

    const superadminEmail = process.env.SUPERADMIN_EMAIL || 'admin@rsystem.com';
    const superadminPassword = process.env.SUPERADMIN_PASSWORD || '@Desbravadores@93';

    // Verificar se já existe
    const existingSuperadmin = await User.findOne({ email: superadminEmail });
    
    if (existingSuperadmin) {
      console.log('⚠️ SUPERADMIN JÁ EXISTE, ATUALIZANDO...');
      
      // Atualizar senha e role
      const hashedPassword = await bcrypt.hash(superadminPassword, 12);
      
      await User.findByIdAndUpdate(existingSuperadmin._id, {
        role: 'superadmin',
        password: hashedPassword,
        isActive: true,
        name: 'Super Admin',
        updatedAt: new Date()
      });
      
      console.log('✅ SUPERADMIN ATUALIZADO COM SUCESSO');
      console.log('📧 Email:', superadminEmail);
      console.log('🔑 Senha:', superadminPassword);
    } else {
      console.log('✅ CRIANDO NOVO SUPERADMIN...');
      
      const hashedPassword = await bcrypt.hash(superadminPassword, 12);
      
      const superadmin = await User.create({
        name: 'Super Admin',
        email: superadminEmail,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true
      });
      
      console.log('🎉 SUPERADMIN CRIADO COM SUCESSO!');
      console.log('📧 Email:', superadmin.email);
      console.log('🔑 Senha:', superadminPassword);
      console.log('🆔 ID:', superadmin._id);
    }

    // Verificar se funcionou
    const testSuperadmin = await User.findOne({ email: superadminEmail });
    const passwordMatch = await bcrypt.compare(superadminPassword, testSuperadmin.password);
    
    console.log('🧪 TESTE FINAL:', {
      encontrado: !!testSuperadmin,
      email: testSuperadmin?.email,
      role: testSuperadmin?.role,
      isActive: testSuperadmin?.isActive,
      senhaCorreta: passwordMatch
    });

  } catch (error) {
    console.error('❌ ERRO:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 DESCONECTADO DO MONGODB');
    process.exit(0);
  }
}

createSuperAdmin();
