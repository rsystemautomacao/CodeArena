import { NextResponse } from 'next/server';

export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Todas as variáveis de ambiente
    allEnvVars: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
      SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO',
      MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADO' : 'FALTANDO',
      JUDGE0_API_URL: process.env.JUDGE0_API_URL,
      JUDGE0_API_KEY: process.env.JUDGE0_API_KEY ? 'CONFIGURADO' : 'FALTANDO',
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    },
    
    // Verificações específicas do superadmin
    superadminCheck: {
      email: {
        value: process.env.SUPERADMIN_EMAIL,
        isLoaded: !!process.env.SUPERADMIN_EMAIL,
        length: process.env.SUPERADMIN_EMAIL?.length || 0,
        expected: 'admin@rsystem.com'
      },
      password: {
        value: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADA' : 'FALTANDO',
        isLoaded: !!process.env.SUPERADMIN_PASSWORD,
        length: process.env.SUPERADMIN_PASSWORD?.length || 0,
        expected: '@Desbravadores@93'
      }
    },
    
    // Lista de todas as chaves de ambiente
    allKeys: Object.keys(process.env).sort(),
    
    // Chaves que contêm palavras específicas
    filteredKeys: {
      nextauth: Object.keys(process.env).filter(key => key.includes('NEXTAUTH')),
      google: Object.keys(process.env).filter(key => key.includes('GOOGLE')),
      superadmin: Object.keys(process.env).filter(key => key.includes('SUPERADMIN')),
      mongodb: Object.keys(process.env).filter(key => key.includes('MONGODB')),
      judge0: Object.keys(process.env).filter(key => key.includes('JUDGE'))
    },
    
    // Problemas identificados
    issues: [] as string[]
  };

  // Identificar problemas
  if (!process.env.SUPERADMIN_EMAIL) {
    debug.issues.push('❌ SUPERADMIN_EMAIL não está carregada');
  } else if (process.env.SUPERADMIN_EMAIL !== 'admin@rsystem.com') {
    debug.issues.push(`❌ SUPERADMIN_EMAIL incorreta: ${process.env.SUPERADMIN_EMAIL}`);
  } else {
    debug.issues.push('✅ SUPERADMIN_EMAIL correta');
  }

  if (!process.env.SUPERADMIN_PASSWORD) {
    debug.issues.push('❌ SUPERADMIN_PASSWORD não está carregada');
  } else if (process.env.SUPERADMIN_PASSWORD !== '@Desbravadores@93') {
    debug.issues.push(`❌ SUPERADMIN_PASSWORD incorreta (tamanho: ${process.env.SUPERADMIN_PASSWORD.length})`);
  } else {
    debug.issues.push('✅ SUPERADMIN_PASSWORD correta');
  }

  if (!process.env.NEXTAUTH_URL) {
    debug.issues.push('❌ NEXTAUTH_URL não está carregada');
  } else {
    debug.issues.push('✅ NEXTAUTH_URL carregada');
  }

  if (!process.env.NEXTAUTH_SECRET) {
    debug.issues.push('❌ NEXTAUTH_SECRET não está carregada');
  } else {
    debug.issues.push('✅ NEXTAUTH_SECRET carregada');
  }

  // Resumo
  const totalIssues = debug.issues.filter(issue => issue.startsWith('❌')).length;
  debug.summary = {
    totalIssues,
    allCorrect: totalIssues === 0,
    message: totalIssues === 0 ? 'Todas as variáveis estão corretas' : `Encontrados ${totalIssues} problemas`
  };

  console.log('🔍 DEBUG ENV VARS:', JSON.stringify(debug, null, 2));
  
  return NextResponse.json(debug);
}
