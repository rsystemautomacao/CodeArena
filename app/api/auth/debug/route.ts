import { NextResponse } from 'next/server';

export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    urls: {
      nextauthUrl: process.env.NEXTAUTH_URL,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      currentUrl: 'https://code-arena-unasp.vercel.app'
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      clientIdValid: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com'),
      clientSecretValid: process.env.GOOGLE_CLIENT_SECRET?.startsWith('GOCSPX-')
    },
    superadmin: {
      email: process.env.SUPERADMIN_EMAIL,
      password: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO',
      emailValid: process.env.SUPERADMIN_EMAIL === 'admin@rsystem.com'
    },
    nextauth: {
      secret: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      secretLength: process.env.NEXTAUTH_SECRET?.length || 0
    },
    allEnvVars: Object.keys(process.env).filter(key => 
      key.includes('NEXTAUTH') || 
      key.includes('GOOGLE') || 
      key.includes('SUPERADMIN') ||
      key.includes('MONGODB')
    ),
    version: '3.0'
  };

  console.log('🔍 DEBUG AUTH:', JSON.stringify(debug, null, 2));
  
  return NextResponse.json(debug);
}