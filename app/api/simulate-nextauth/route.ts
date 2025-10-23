import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔐 ===== SIMULANDO NEXTAUTH =====');
    console.log('📧 EMAIL RECEBIDO:', email);
    console.log('🔑 SENHA RECEBIDA:', password ? 'PRESENTE' : 'AUSENTE');
    console.log('🌍 AMBIENTE:', process.env.NODE_ENV);
    console.log('⚙️ SUPERADMIN_EMAIL:', process.env.SUPERADMIN_EMAIL);
    console.log('⚙️ SUPERADMIN_PASSWORD:', process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO');
    console.log('🔐 ================================');

    if (!email || !password) {
      console.log('❌ ERRO: Credenciais vazias');
      return NextResponse.json({
        success: false,
        message: 'Credenciais vazias'
      });
    }

    // CONECTAR AO BANCO DE DADOS E VERIFICAR USUÁRIO
    console.log('🔗 CONECTANDO AO BANCO DE DADOS...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ CONEXÃO COM BANCO ESTABELECIDA');
    
    const db = mongoose.connection.db;
    if (!db) {
      console.log('❌ ERRO: Não foi possível obter referência do banco');
      throw new Error('Não foi possível conectar ao banco de dados');
    }
    
    const usersCollection = db.collection('users');
    console.log('🔍 BUSCANDO USUÁRIO:', email);
    
    // VERIFICAR SE É SUPERADMIN E FORÇAR CRIAÇÃO SE NECESSÁRIO
    if (email === 'admin@rsystem.com') {
      console.log('🔧 VERIFICANDO SUPERADMIN...');
      let superadmin = await usersCollection.findOne({ 
        email: 'admin@rsystem.com',
        role: 'superadmin'
      });
      
      if (!superadmin || !superadmin.password || superadmin.password.length === 0) {
        console.log('🔧 RECRIANDO SUPERADMIN...');
        // Deletar superadmin existente
        await usersCollection.deleteMany({ 
          email: 'admin@rsystem.com',
          role: 'superadmin'
        });
        
        // Criar novo superadmin
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
        console.log('✅ SUPERADMIN RECRIADO:', result.insertedId);
        
        superadmin = await usersCollection.findOne({ 
          email: 'admin@rsystem.com',
          role: 'superadmin'
        });
      }
      
      if (superadmin) {
        console.log('✅ SUPERADMIN ENCONTRADO:', {
          id: superadmin._id,
          email: superadmin.email,
          hasPassword: !!superadmin.password,
          passwordLength: superadmin.password ? superadmin.password.length : 0
        });
        
        // Verificar senha
        console.log('🔑 VERIFICANDO SENHA DO SUPERADMIN...');
        const isPasswordValid = await bcrypt.compare(password, superadmin.password);
        console.log('🔑 RESULTADO DA VERIFICAÇÃO:', isPasswordValid);
        
        if (isPasswordValid) {
          console.log('✅ ===== LOGIN SUCESSO =====');
          console.log('🆔 ID:', superadmin._id);
          console.log('📧 Email:', superadmin.email);
          console.log('👤 Nome:', superadmin.name);
          console.log('🎭 Role:', superadmin.role);
          console.log('🖼️ Imagem:', superadmin.image);
          console.log('✅ =========================');

          await mongoose.disconnect();

          const userToReturn = {
            id: superadmin._id.toString(),
            name: superadmin.name,
            email: superadmin.email,
            role: superadmin.role,
            image: superadmin.image,
          };
          
          console.log('🚀 RETORNANDO USUÁRIO:', userToReturn);
          return NextResponse.json({
            success: true,
            message: 'Login bem-sucedido',
            user: userToReturn
          });
        } else {
          console.log('❌ SENHA DO SUPERADMIN INCORRETA');
          await mongoose.disconnect();
          return NextResponse.json({
            success: false,
            message: 'Senha incorreta'
          });
        }
      }
    }
    
    const user = await usersCollection.findOne({ 
      email: email,
      isActive: true 
    });

    if (!user) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO NO BANCO');
      console.log('📧 Email buscado:', email);
      await mongoose.disconnect();
      return NextResponse.json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    console.log('✅ USUÁRIO ENCONTRADO:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Verificar senha
    console.log('🔑 VERIFICANDO SENHA...');
    console.log('🔑 Senha fornecida:', password);
    console.log('🔑 Hash no banco:', user.password ? 'PRESENTE' : 'AUSENTE');
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 RESULTADO DA VERIFICAÇÃO:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ SENHA INCORRETA');
      console.log('🔑 Senha fornecida:', password);
      console.log('🔑 Hash no banco:', user.password);
      await mongoose.disconnect();
      return NextResponse.json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    console.log('✅ ===== LOGIN SUCESSO =====');
    console.log('🆔 ID:', user._id);
    console.log('📧 Email:', user.email);
    console.log('👤 Nome:', user.name);
    console.log('🎭 Role:', user.role);
    console.log('🖼️ Imagem:', user.image);
    console.log('✅ =========================');

    await mongoose.disconnect();

    const userToReturn = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    };
    
    console.log('🚀 RETORNANDO USUÁRIO:', userToReturn);
    return NextResponse.json({
      success: true,
      message: 'Login bem-sucedido',
      user: userToReturn
    });
    
  } catch (error) {
    console.log('❌ ===== ERRO NO LOGIN =====');
    console.log('❌ Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
    console.log('❌ Mensagem:', error instanceof Error ? error.message : String(error));
    console.log('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
    console.log('❌ =========================');
    return NextResponse.json({
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
