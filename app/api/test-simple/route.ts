import { NextResponse } from 'next/server';

export async function GET() {
  const result = {
    timestamp: new Date().toISOString(),
    test: 'TESTE SIMPLES',
    superadminEmail: process.env.SUPERADMIN_EMAIL,
    superadminPassword: process.env.SUPERADMIN_PASSWORD,
    emailMatch: 'admin@rsystem.com' === process.env.SUPERADMIN_EMAIL,
    passwordMatch: '@Desbravadores@93' === process.env.SUPERADMIN_PASSWORD,
    emailLength: process.env.SUPERADMIN_EMAIL?.length,
    passwordLength: process.env.SUPERADMIN_PASSWORD?.length,
    nodeEnv: process.env.NODE_ENV
  };

  console.log('🧪 TESTE SIMPLES:', JSON.stringify(result, null, 2));
  
  return NextResponse.json(result);
}
