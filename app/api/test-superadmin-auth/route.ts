import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TESTANDO AUTENTICAÇÃO DO SUPERADMIN...');
    
    // Verificar se há sessão ativa
    const session = await getServerSession(authOptions);
    
    console.log('📋 SESSÃO ATUAL:', {
      hasSession: !!session,
      user: session?.user,
      role: session?.user?.role,
      email: session?.user?.email
    });
    
    // Verificar se é superadmin
    const isSuperadmin = session?.user?.email === 'admin@rsystem.com' && 
                        session?.user?.role === 'superadmin';
    
    console.log('🔧 É SUPERADMIN?', isSuperadmin);
    
    return NextResponse.json({
      success: true,
      isAuthenticated: !!session,
      isSuperadmin: isSuperadmin,
      session: session ? {
        user: session.user,
        role: session.user?.role,
        email: session.user?.email
      } : null,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE DE AUTENTICAÇÃO:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 TESTANDO LOGIN DO SUPERADMIN...');
    
    const { email, password } = await request.json();
    
    console.log('📧 EMAIL:', email);
    console.log('🔑 HAS PASSWORD:', !!password);
    
    // Verificar credenciais do superadmin
    if (email === 'admin@rsystem.com' && password === '@Desbravadores@93') {
      console.log('✅ CREDENCIAIS DO SUPERADMIN VÁLIDAS');
      
      return NextResponse.json({
        success: true,
        message: 'Credenciais do superadmin válidas',
        user: {
          id: 'superadmin-001',
          name: 'Super Admin',
          email: 'admin@rsystem.com',
          role: 'superadmin'
        },
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ CREDENCIAIS INVÁLIDAS');
      
      return NextResponse.json({
        success: false,
        message: 'Credenciais inválidas',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE DE LOGIN:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
