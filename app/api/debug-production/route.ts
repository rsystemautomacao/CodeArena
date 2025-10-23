import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🔍 DEBUG PRODUÇÃO - VERIFICANDO CONFIGURAÇÕES...');
    
    // Verificar variáveis de ambiente
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***CONFIGURADO***' : '❌ NÃO CONFIGURADO',
      MONGODB_URI: process.env.MONGODB_URI ? '***CONFIGURADO***' : '❌ NÃO CONFIGURADO',
      SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
      SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD ? '***CONFIGURADO***' : '❌ NÃO CONFIGURADO',
      NODE_ENV: process.env.NODE_ENV
    };

    console.log('📋 VARIÁVEIS DE AMBIENTE:', envVars);

    // Conectar ao banco
    await connectDB();
    console.log('✅ CONECTADO AO MONGODB');

    // Verificar superadmin
    const superadmin = await User.findOne({ email: 'admin@rsystem.com' });
    
    if (!superadmin) {
      console.log('❌ SUPERADMIN NÃO ENCONTRADO');
      
      // Criar superadmin
      const hashedPassword = await bcrypt.hash('@Desbravadores@93', 12);
      
      const newSuperadmin = await User.create({
        name: 'Super Admin',
        email: 'admin@rsystem.com',
        password: hashedPassword,
        role: 'superadmin',
        isActive: true
      });
      
      console.log('✅ SUPERADMIN CRIADO:', newSuperadmin.email);
      
      return NextResponse.json({
        success: true,
        message: 'Superadmin criado com sucesso',
        environment: envVars,
        superadmin: {
          id: newSuperadmin._id,
          email: newSuperadmin.email,
          role: newSuperadmin.role,
          isActive: newSuperadmin.isActive
        }
      });
    }

    // Testar senha
    const passwordMatch = await bcrypt.compare('@Desbravadores@93', superadmin.password);
    
    console.log('🔍 SUPERADMIN ENCONTRADO:', {
      id: superadmin._id,
      email: superadmin.email,
      role: superadmin.role,
      isActive: superadmin.isActive,
      hasPassword: !!superadmin.password,
      passwordMatch
    });

    // Se senha não confere, atualizar
    if (!passwordMatch) {
      console.log('🔄 ATUALIZANDO SENHA DO SUPERADMIN...');
      
      const hashedPassword = await bcrypt.hash('@Desbravadores@93', 12);
      
      await User.findByIdAndUpdate(superadmin._id, {
        password: hashedPassword,
        isActive: true,
        updatedAt: new Date()
      });
      
      console.log('✅ SENHA ATUALIZADA');
    }

    return NextResponse.json({
      success: true,
      message: 'Debug de produção concluído',
      environment: envVars,
      superadmin: {
        id: superadmin._id,
        email: superadmin.email,
        role: superadmin.role,
        isActive: superadmin.isActive,
        hasPassword: !!superadmin.password,
        passwordMatch
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ ERRO NO DEBUG PRODUÇÃO:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro no debug de produção',
      error: error.message,
      environment: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***CONFIGURADO***' : '❌ NÃO CONFIGURADO',
        MONGODB_URI: process.env.MONGODB_URI ? '***CONFIGURADO***' : '❌ NÃO CONFIGURADO',
        NODE_ENV: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
