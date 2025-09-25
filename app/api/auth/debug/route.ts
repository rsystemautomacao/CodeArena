import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    timestamp: new Date().toISOString(),
  });
}