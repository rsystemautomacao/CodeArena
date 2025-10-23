import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔐 FORÇANDO LOGIN:', { email, hasPassword: !!password });
    
    // Conectar ao banco
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    if (!db) {
      await mongoose.disconnect();
      return NextResponse.json({ success: false, message: 'Erro de conexão' });
    }
    
    const usersCollection = db.collection('users');
    
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
        
        await mongoose.disconnect();
        
        if (isPasswordValid) {
          console.log('✅ LOGIN SUPERADMIN SUCESSO!');
          return NextResponse.json({
            success: true,
            message: 'Login bem-sucedido',
            user: {
              id: superadmin._id.toString(),
              name: superadmin.name,
              email: superadmin.email,
              role: superadmin.role,
              image: superadmin.image,
            }
          });
        } else {
          console.log('❌ SENHA DO SUPERADMIN INCORRETA');
          return NextResponse.json({
            success: false,
            message: 'Senha incorreta',
            debug: {
              email: superadmin.email,
              hasPassword: true,
              passwordLength: superadmin.password.length
            }
          });
        }
      }
    }
    
    // Buscar usuário normal
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
    console.log('🔑 RESULTADO DA VERIFICAÇÃO:', isPasswordValid);
    
    await mongoose.disconnect();
    
    if (isPasswordValid) {
      console.log('✅ LOGIN SUCESSO!');
      return NextResponse.json({
        success: true,
        message: 'Login bem-sucedido',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        }
      });
    } else {
      console.log('❌ SENHA INCORRETA');
      return NextResponse.json({
        success: false,
        message: 'Senha incorreta'
      });
    }
    
  } catch (error) {
    console.log('❌ ERRO:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
