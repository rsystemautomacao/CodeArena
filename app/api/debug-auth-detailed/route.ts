import { NextResponse } from 'next/server';

export async function GET() {
  const debug: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // URLs e configurações
    urls: {
      nextauthUrl: process.env.NEXTAUTH_URL,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      currentUrl: 'https://code-arena-unasp.vercel.app'
    },
    
    // Google OAuth - verificação detalhada
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      clientIdValid: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com'),
      clientSecretValid: process.env.GOOGLE_CLIENT_SECRET?.startsWith('GOCSPX-'),
      clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0
    },
    
    // Superadmin - verificação detalhada
    superadmin: {
      email: process.env.SUPERADMIN_EMAIL,
      password: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO',
      emailValid: process.env.SUPERADMIN_EMAIL === 'admin@rsystem.com',
      passwordLength: process.env.SUPERADMIN_PASSWORD?.length || 0
    },
    
    // NextAuth
    nextauth: {
      secret: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      secretLength: process.env.NEXTAUTH_SECRET?.length || 0
    },
    
    // MongoDB
    mongodb: {
      uri: process.env.MONGODB_URI ? 'CONFIGURADO' : 'FALTANDO',
      uriLength: process.env.MONGODB_URI?.length || 0
    },
    
    // Análise de problemas
    issues: [] as string[],
    
    // Configurações esperadas do Google Console
    expectedGoogleConfig: {
      authorizedOrigins: [
        'https://code-arena-unasp.vercel.app',
        'http://localhost:3000'
      ],
      authorizedRedirects: [
        'https://code-arena-unasp.vercel.app/api/auth/callback/google',
        'http://localhost:3000/api/auth/callback/google'
      ]
    },
    
    // Resumo (inicializado vazio)
    overall: {
      totalIssues: 0,
      allCorrect: false,
      summary: ''
    }
  };

  // Verificar problemas do Google OAuth
  if (!debug.google.clientId) {
    debug.issues.push('❌ GOOGLE_CLIENT_ID não configurado');
  } else if (!debug.google.clientIdValid) {
    debug.issues.push('❌ GOOGLE_CLIENT_ID formato incorreto (deve terminar com .apps.googleusercontent.com)');
  } else {
    debug.issues.push('✅ GOOGLE_CLIENT_ID correto');
  }
  
  if (!debug.google.clientSecret) {
    debug.issues.push('❌ GOOGLE_CLIENT_SECRET não configurado');
  } else if (!debug.google.clientSecretValid) {
    debug.issues.push('❌ GOOGLE_CLIENT_SECRET formato incorreto (deve começar com GOCSPX-)');
  } else {
    debug.issues.push('✅ GOOGLE_CLIENT_SECRET correto');
  }
  
  if (debug.urls.nextauthUrl !== 'https://code-arena-unasp.vercel.app') {
    debug.issues.push(`❌ NEXTAUTH_URL incorreto: ${debug.urls.nextauthUrl}`);
  } else {
    debug.issues.push('✅ NEXTAUTH_URL correto');
  }
  
  if (debug.urls.callbackUrl !== debug.expectedGoogleConfig.authorizedRedirects[0]) {
    debug.issues.push(`❌ Callback URL incorreto: ${debug.urls.callbackUrl}`);
  } else {
    debug.issues.push('✅ Callback URL correto');
  }

  // Verificar problemas do Superadmin
  if (!debug.superadmin.email) {
    debug.issues.push('❌ SUPERADMIN_EMAIL não configurado');
  } else if (!debug.superadmin.emailValid) {
    debug.issues.push(`❌ SUPERADMIN_EMAIL incorreto: ${debug.superadmin.email}`);
  } else {
    debug.issues.push('✅ SUPERADMIN_EMAIL correto');
  }
  
  if (!debug.superadmin.password) {
    debug.issues.push('❌ SUPERADMIN_PASSWORD não configurado');
  } else {
    debug.issues.push('✅ SUPERADMIN_PASSWORD configurado');
  }

  // Verificar NextAuth
  if (!debug.nextauth.secret) {
    debug.issues.push('❌ NEXTAUTH_SECRET não configurado');
  } else if (debug.nextauth.secretLength < 32) {
    debug.issues.push('❌ NEXTAUTH_SECRET muito curto (mínimo 32 caracteres)');
  } else {
    debug.issues.push('✅ NEXTAUTH_SECRET correto');
  }

  // Verificar MongoDB
  if (!debug.mongodb.uri) {
    debug.issues.push('❌ MONGODB_URI não configurado');
  } else {
    debug.issues.push('✅ MONGODB_URI configurado');
  }

  // Resumo
  const totalIssues = debug.issues.filter((issue: string) => issue.startsWith('❌')).length;
  debug.overall = {
    totalIssues,
    allCorrect: totalIssues === 0,
    summary: totalIssues === 0 ? 'Todas as configurações estão corretas' : `Encontrados ${totalIssues} problemas`
  };

  console.log('🔍 DEBUG AUTH DETAILED:', JSON.stringify(debug, null, 2));
  
  return NextResponse.json(debug);
}
