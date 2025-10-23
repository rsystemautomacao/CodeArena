import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🔍 TESTE COMPLETO DE AUTENTICAÇÃO...');
    
    // 1. Verificar variáveis de ambiente
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADO' : 'FALTANDO',
      SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
      SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO',
      NODE_ENV: process.env.NODE_ENV
    };

    console.log('📋 VARIÁVEIS DE AMBIENTE:', envVars);

    // 2. Testar conexão com MongoDB
    await connectDB();
    console.log('✅ CONECTADO AO MONGODB');

    // 3. Verificar superadmin
    const superadmin = await User.findOne({ email: 'admin@rsystem.com' });
    
    if (!superadmin) {
      return NextResponse.json({
        success: false,
        message: 'Superadmin não encontrado',
        envVars
      }, { status: 404 });
    }

    console.log('👤 SUPERADMIN ENCONTRADO:', {
      id: superadmin._id,
      email: superadmin.email,
      role: superadmin.role,
      isActive: superadmin.isActive,
      hasPassword: !!superadmin.password,
      passwordLength: superadmin.password?.length || 0
    });

    // 4. Testar senha do superadmin
    let passwordMatch = false;
    if (superadmin.password && superadmin.password.length > 0) {
      try {
        passwordMatch = await bcrypt.compare('@Desbravadores@93', superadmin.password);
        console.log('🔑 TESTE DE SENHA:', { passwordMatch });
      } catch (error) {
        console.log('❌ ERRO AO TESTAR SENHA:', error);
      }
    } else {
      console.log('❌ SENHA VAZIA OU INEXISTENTE');
    }

    // 5. Testar configuração do NextAuth
    const session = await getServerSession(authOptions);
    console.log('🔐 SESSÃO ATUAL:', {
      hasSession: !!session,
      user: session?.user?.email || 'NENHUM'
    });

    // 6. Verificar Google OAuth
    const googleConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      clientIdValid: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com') || false,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    };

    console.log('🔍 CONFIGURAÇÃO GOOGLE:', googleConfig);

    return NextResponse.json({
      success: true,
      message: 'Teste de autenticação concluído',
      details: {
        environment: envVars,
        superadmin: {
          id: superadmin._id,
          email: superadmin.email,
          role: superadmin.role,
          isActive: superadmin.isActive,
          hasPassword: !!superadmin.password,
          passwordLength: superadmin.password?.length || 0,
          passwordMatch
        },
        session: {
          hasSession: !!session,
          userEmail: session?.user?.email || null
        },
        googleOAuth: googleConfig,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ ERRO NO TESTE DE AUTENTICAÇÃO:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro no teste de autenticação',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}