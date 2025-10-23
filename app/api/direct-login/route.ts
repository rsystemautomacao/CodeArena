import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    
    // Verificar se é o superadmin
    if (email === 'admin@rsystem.com' && password === '@Desbravadores@93') {
      console.log('✅ SUPERADMIN DETECTADO - LOGIN DIRETO');
      
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
    
    console.log('❌ CREDENCIAIS INVÁLIDAS');
    return NextResponse.json({
      success: false,
      message: 'Credenciais inválidas'
    });
    
  } catch (error) {
    console.log('❌ ERRO CRÍTICO:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}