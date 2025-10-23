import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  console.log('🔍 ===== DEBUG SUPERADMIN LOGIN =====');
  
  try {
    const { email, password } = await request.json();
    
    console.log('📧 EMAIL RECEBIDO:', email);
    console.log('🔑 SENHA RECEBIDA:', password ? 'PRESENTE' : 'AUSENTE');
    console.log('🌍 AMBIENTE:', process.env.NODE_ENV);
    console.log('⚙️ SUPERADMIN_EMAIL:', process.env.SUPERADMIN_EMAIL);
    console.log('⚙️ SUPERADMIN_PASSWORD:', process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO');
    
    // Conectar ao banco
    console.log('🔗 CONECTANDO AO BANCO...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ CONEXÃO ESTABELECIDA');
    
    const db = mongoose.connection.db;
    if (!db) {
      console.log('❌ ERRO: Não foi possível obter referência do banco');
      await mongoose.disconnect();
      return NextResponse.json({
        success: false,
        message: 'Erro de conexão com banco de dados'
      }, { status: 500 });
    }
    
    const usersCollection = db.collection('users');
    
    // Buscar TODOS os usuários para debug
    console.log('🔍 BUSCANDO TODOS OS USUÁRIOS...');
    const allUsers = await usersCollection.find({}).toArray();
    console.log('👥 TOTAL DE USUÁRIOS:', allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`👤 USUÁRIO ${index + 1}:`, {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        createdAt: user.createdAt
      });
    });
    
    // Buscar usuário específico
    console.log('🔍 BUSCANDO USUÁRIO ESPECÍFICO:', email);
    const user = await usersCollection.findOne({ 
      email: email,
      isActive: true 
    });
    
    if (!user) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO');
      console.log('🔍 Buscando usuários com email similar...');
      
      const similarUsers = await usersCollection.find({ 
        email: { $regex: email, $options: 'i' }
      }).toArray();
      
      console.log('👥 USUÁRIOS SIMILARES:', similarUsers.length);
      similarUsers.forEach(u => {
        console.log('  - Email:', u.email, '| Ativo:', u.isActive, '| Role:', u.role);
      });
      
      await mongoose.disconnect();
      return NextResponse.json({
        success: false,
        message: 'Usuário não encontrado',
        debug: {
          emailBuscado: email,
          usuariosSimilares: similarUsers.map(u => ({
            email: u.email,
            isActive: u.isActive,
            role: u.role
          })),
          totalUsuarios: allUsers.length
        }
      });
    }
    
    console.log('✅ USUÁRIO ENCONTRADO:', {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Verificar senha
    console.log('🔑 VERIFICANDO SENHA...');
    console.log('🔑 Senha fornecida:', password);
    console.log('🔑 Hash no banco:', user.password ? 'PRESENTE' : 'AUSENTE');
    console.log('🔑 Tamanho do hash:', user.password ? user.password.length : 0);
    
    let passwordMatch = false;
    let passwordError = null;
    
    try {
      if (user.password && user.password.length > 0) {
        passwordMatch = await bcrypt.compare(password, user.password);
        console.log('🔑 RESULTADO DA VERIFICAÇÃO:', passwordMatch);
      } else {
        console.log('❌ SENHA VAZIA OU INEXISTENTE NO BANCO');
        passwordError = 'Senha vazia ou inexistente no banco';
      }
    } catch (error) {
      console.log('❌ ERRO AO COMPARAR SENHA:', error);
      passwordError = error instanceof Error ? error.message : 'Erro desconhecido';
    }
    
    await mongoose.disconnect();
    
    return NextResponse.json({
      success: passwordMatch,
      message: passwordMatch ? 'Login bem-sucedido' : 'Senha incorreta',
      debug: {
        email: email,
        userFound: !!user,
        userDetails: user ? {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0
        } : null,
        passwordMatch: passwordMatch,
        passwordError: passwordError,
        environment: process.env.NODE_ENV,
        superadminEmail: process.env.SUPERADMIN_EMAIL,
        superadminPassword: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO'
      }
    });
    
  } catch (error) {
    console.log('❌ ERRO GERAL:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      debug: {
        environment: process.env.NODE_ENV,
        superadminEmail: process.env.SUPERADMIN_EMAIL,
        superadminPassword: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO'
      }
    }, { status: 500 });
  }
}
