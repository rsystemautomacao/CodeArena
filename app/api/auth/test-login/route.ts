import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  const debug = {
    timestamp: new Date().toISOString(),
    test: 'LOGIN TEST',
    input: {
      email,
      hasPassword: !!password,
      passwordLength: password?.length || 0
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      superadminEmail: process.env.SUPERADMIN_EMAIL,
      superadminPassword: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO',
      superadminPasswordLength: process.env.SUPERADMIN_PASSWORD?.length || 0
    },
    validation: {
      emailMatch: email === process.env.SUPERADMIN_EMAIL,
      passwordMatch: password === process.env.SUPERADMIN_PASSWORD,
      exactEmail: email,
      exactSuperadminEmail: process.env.SUPERADMIN_EMAIL
    },
    result: {
      isSuperadmin: email === process.env.SUPERADMIN_EMAIL,
      passwordCorrect: password === process.env.SUPERADMIN_PASSWORD,
      shouldLogin: email === process.env.SUPERADMIN_EMAIL && password === process.env.SUPERADMIN_PASSWORD
    }
  };

  console.log('🧪 LOGIN TEST:', JSON.stringify(debug, null, 2));
  
  return NextResponse.json(debug);
}
