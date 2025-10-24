import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 VERIFICANDO VARIÁVEIS DE AMBIENTE...');
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextauthUrl: process.env.NEXTAUTH_URL,
      nextauthSecret: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      mongodbUri: process.env.MONGODB_URI ? 'CONFIGURADO' : 'FALTANDO',
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Verificar problemas
    if (!debug.googleClientId) {
      debug.issues.push('❌ GOOGLE_CLIENT_ID não está definido');
      debug.recommendations.push('Configure GOOGLE_CLIENT_ID no Vercel');
    } else if (debug.googleClientId === '$GOOGLE_CLIENT_ID') {
      debug.issues.push('❌ GOOGLE_CLIENT_ID está como string literal $GOOGLE_CLIENT_ID');
      debug.recommendations.push('Verificar se a variável está configurada corretamente no Vercel');
    } else if (!debug.googleClientId.includes('.apps.googleusercontent.com')) {
      debug.issues.push('❌ GOOGLE_CLIENT_ID formato incorreto');
      debug.recommendations.push('Verificar se o Client ID está correto');
    }

    if (!debug.googleClientSecret) {
      debug.issues.push('❌ GOOGLE_CLIENT_SECRET não está definido');
      debug.recommendations.push('Configure GOOGLE_CLIENT_SECRET no Vercel');
    } else if (debug.googleClientSecret === '$GOOGLE_CLIENT_SECRET') {
      debug.issues.push('❌ GOOGLE_CLIENT_SECRET está como string literal $GOOGLE_CLIENT_SECRET');
      debug.recommendations.push('Verificar se a variável está configurada corretamente no Vercel');
    }

    if (!debug.nextauthUrl) {
      debug.issues.push('❌ NEXTAUTH_URL não está definido');
      debug.recommendations.push('Configure NEXTAUTH_URL no Vercel');
    }

    if (!debug.nextauthSecret) {
      debug.issues.push('❌ NEXTAUTH_SECRET não está definido');
      debug.recommendations.push('Configure NEXTAUTH_SECRET no Vercel');
    }

    // Adicionar informações sobre o problema específico
    if (debug.googleClientId === '$GOOGLE_CLIENT_ID' || debug.googleClientSecret === '$GOOGLE_CLIENT_SECRET') {
      debug.recommendations.push('🚨 PROBLEMA IDENTIFICADO: As variáveis estão sendo interpretadas como strings literais');
      debug.recommendations.push('🔧 SOLUÇÃO: Verificar se as variáveis estão configuradas corretamente no Vercel Dashboard');
      debug.recommendations.push('📋 PASSO A PASSO:');
      debug.recommendations.push('1. Acesse o Vercel Dashboard');
      debug.recommendations.push('2. Vá para Settings > Environment Variables');
      debug.recommendations.push('3. Verifique se GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET estão configuradas');
      debug.recommendations.push('4. Se estiverem, delete e recrie as variáveis');
      debug.recommendations.push('5. Faça um novo deploy');
    }

    if (debug.issues.length === 0) {
      debug.issues.push('✅ Todas as variáveis estão configuradas corretamente');
    }

    console.log('🔍 DEBUG ENV VARS:', JSON.stringify(debug, null, 2));
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.log('❌ ERRO NO DEBUG ENV VARS:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}