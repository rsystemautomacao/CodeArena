import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  
  console.log('🧪 TESTE SUPERADMIN DIRETO:', {
    email,
    password,
    envEmail: process.env.SUPERADMIN_EMAIL,
    envPassword: process.env.SUPERADMIN_PASSWORD,
    emailMatch: email === process.env.SUPERADMIN_EMAIL,
    passwordMatch: password === process.env.SUPERADMIN_PASSWORD
  });

  const isValid = email === process.env.SUPERADMIN_EMAIL && password === process.env.SUPERADMIN_PASSWORD;
  
  return NextResponse.json({
    success: isValid,
    message: isValid ? 'Credenciais corretas' : 'Credenciais incorretas',
    details: {
      email,
      envEmail: process.env.SUPERADMIN_EMAIL,
      emailMatch: email === process.env.SUPERADMIN_EMAIL,
      passwordMatch: password === process.env.SUPERADMIN_PASSWORD
    }
  });
}
