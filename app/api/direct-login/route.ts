import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 LOGIN DIRETO INICIADO');
    
    const { email, password } = await request.json();
    
    console.log('📧 EMAIL:', email);
    console.log('🔑 HAS PASSWORD:', !!password);
    
    if (!email || !password) {
      console.log('❌ CAMPOS OBRIGATÓRIOS FALTANDO');
      return NextResponse.json({ 
        success: false, 
        message: 'Email e senha são obrigatórios' 
      });
    }
    
    // Verificar se é o superadmin (login direto)
    if (email === 'admin@rsystem.com' && password === '@Desbravadores@93') {
      console.log('✅ SUPERADMIN DETECTADO - LOGIN DIRETO');
      
      // Garantir que o superadmin existe no banco
      try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
        
        await mongoose.connect(MONGODB_URI);
        console.log('✅ CONEXÃO COM BANCO ESTABELECIDA');
        
        const db = mongoose.connection.db;
        if (db) {
          const usersCollection = db.collection('users');
          
          // Verificar se superadmin existe
          let superadmin = await usersCollection.findOne({ 
            email: 'admin@rsystem.com',
            role: 'superadmin'
          });
          
          if (!superadmin) {
            console.log('🔧 CRIANDO SUPERADMIN NO BANCO...');
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
            
            await usersCollection.insertOne(newSuperadmin);
            console.log('✅ SUPERADMIN CRIADO NO BANCO');
          }
          
          await mongoose.disconnect();
        }
      } catch (error) {
        console.log('⚠️ ERRO AO CONECTAR COM BANCO (continuando com login direto):', error);
        // Continuar com login direto mesmo se houver erro no banco
      }
      
      // Criar JWT token
      const token = jwt.sign(
        { 
          id: 'superadmin-001',
          email: 'admin@rsystem.com',
          role: 'superadmin',
          name: 'Super Admin'
        },
        process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      console.log('🎫 TOKEN CRIADO COM SUCESSO');
      
      return NextResponse.json({
        success: true,
        message: 'Login bem-sucedido',
        token: token,
        user: {
          id: 'superadmin-001',
          name: 'Super Admin',
          email: 'admin@rsystem.com',
          role: 'superadmin',
          image: null,
        }
      });
    }
    
    // Tentar login com banco de dados para outros usuários
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
      
      await mongoose.connect(MONGODB_URI);
      console.log('✅ CONEXÃO COM BANCO ESTABELECIDA');
      
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Não foi possível conectar ao banco de dados');
      }
      
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ 
        email: email,
        isActive: true 
      });

      if (!user) {
        console.log('❌ USUÁRIO NÃO ENCONTRADO');
        await mongoose.disconnect();
        return NextResponse.json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log('❌ SENHA INCORRETA');
        await mongoose.disconnect();
        return NextResponse.json({
          success: false,
          message: 'Senha incorreta'
        });
      }

      // Criar JWT token
      const token = jwt.sign(
        { 
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name
        },
        process.env.NEXTAUTH_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      console.log('🎫 TOKEN CRIADO COM SUCESSO');
      
      await mongoose.disconnect();
      
      return NextResponse.json({
        success: true,
        message: 'Login bem-sucedido',
        token: token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        }
      });
      
    } catch (error) {
      console.log('❌ ERRO NO LOGIN COM BANCO:', error);
      await mongoose.disconnect();
      return NextResponse.json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.log('❌ ERRO CRÍTICO:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}