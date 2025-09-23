import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    origin,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Configurado' : 'Não configurado',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Configurado' : 'Não configurado',
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Configurado' : 'Não configurado',
    redirectUri: `${origin}/api/auth/callback/google`,
    expectedUrls: [
      `${origin}/api/auth/callback/google`,
      'http://localhost:3000/api/auth/callback/google',
      'https://code-arena-unasp.vercel.app/api/auth/callback/google'
    ]
  });
}
