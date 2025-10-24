import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('🧹 LIMPANDO SESSÃO...');
    
    const cookieStore = cookies();
    
    // Remover todos os cookies relacionados ao NextAuth
    const nextAuthCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token'
    ];
    
    const clearedCookies: string[] = [];
    
    nextAuthCookies.forEach(cookieName => {
      try {
        cookieStore.delete(cookieName);
        clearedCookies.push(cookieName);
        console.log(`✅ Cookie removido: ${cookieName}`);
      } catch (error) {
        console.log(`⚠️ Cookie não encontrado: ${cookieName}`);
      }
    });
    
    const response = {
      success: true,
      message: 'Sessão limpa com sucesso',
      timestamp: new Date().toISOString(),
      clearedCookies,
      instructions: [
        '1. Feche todas as abas do site',
        '2. Abra uma nova aba',
        '3. Acesse o site novamente',
        '4. Faça login com Google',
        '5. O papel do usuário deve ser reconhecido corretamente'
      ]
    };
    
    console.log('🧹 SESSÃO LIMPA:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.log('❌ ERRO AO LIMPAR SESSÃO:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
