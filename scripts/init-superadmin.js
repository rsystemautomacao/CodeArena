const mongoose = require('mongoose');

// Carregar variáveis de ambiente
const path = require('path');
const fs = require('fs');

// Função para carregar .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnvFile();

// Definir o schema do User diretamente
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
  image: {
    type: String,
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

async function initSuperAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB');

    // Verificar se o superadmin já existe
    const existingSuperAdmin = await User.findOne({ 
      email: process.env.SUPERADMIN_EMAIL 
    });

    if (existingSuperAdmin) {
      console.log('Super admin já existe:', existingSuperAdmin.email);
      return;
    }

    // Criar o superadmin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: process.env.SUPERADMIN_EMAIL,
      role: 'superadmin',
      isActive: true,
    });

    console.log('Super admin criado com sucesso:', superAdmin.email);
  } catch (error) {
    console.error('Erro ao inicializar super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
}

initSuperAdmin();
