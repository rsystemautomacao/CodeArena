import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🧪 TESTE SUPERADMIN LOGIN:', {
      timestamp: new Date().toISOString(),
      provided: {
        email,
        password: password ? 'FORNECIDA' : 'FALTANDO',
        passwordLength: password?.length || 0
      },
      environment: {
        envEmail: process.env.SUPERADMIN_EMAIL,
        envPassword: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADA' : 'FALTANDO',
        envPasswordLength: process.env.SUPERADMIN_PASSWORD?.length || 0,
        nodeEnv: process.env.NODE_ENV
      },
      comparison: {
        emailMatch: email === process.env.SUPERADMIN_EMAIL,
        passwordMatch: password === process.env.SUPERADMIN_PASSWORD,
        emailExact: `"${email}" === "${process.env.SUPERADMIN_EMAIL}"`,
        passwordExact: `"${password}" === "${process.env.SUPERADMIN_PASSWORD}"`
      }
    });

    // Teste detalhado das credenciais
    const emailMatch = email === process.env.SUPERADMIN_EMAIL;
    const passwordMatch = password === process.env.SUPERADMIN_PASSWORD;
    
    const result = {
      success: emailMatch && passwordMatch,
      timestamp: new Date().toISOString(),
      test: 'SUPERADMIN LOGIN TEST',
      
      // Credenciais fornecidas
      provided: {
        email,
        password: password ? 'FORNECIDA' : 'FALTANDO',
        passwordLength: password?.length || 0
      },
      
      // Configurações do ambiente
      environment: {
        envEmail: process.env.SUPERADMIN_EMAIL,
        envPassword: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADA' : 'FALTANDO',
        envPasswordLength: process.env.SUPERADMIN_PASSWORD?.length || 0,
        nodeEnv: process.env.NODE_ENV
      },
      
      // Comparações detalhadas
      comparison: {
        emailMatch,
        passwordMatch,
        emailExact: `"${email}" === "${process.env.SUPERADMIN_EMAIL}"`,
        passwordExact: `"${password}" === "${process.env.SUPERADMIN_PASSWORD}"`,
        emailChars: {
          provided: email?.split('').map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`),
          env: process.env.SUPERADMIN_EMAIL?.split('').map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`)
        },
        passwordChars: {
          provided: password?.split('').map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`),
          env: process.env.SUPERADMIN_PASSWORD?.split('').map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`)
        }
      },
      
      // Resultado
      result: {
        isValid: emailMatch && passwordMatch,
        message: emailMatch && passwordMatch ? 'Credenciais corretas' : 'Credenciais incorretas'
      }
    };

    console.log('🔍 RESULTADO TESTE SUPERADMIN:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE SUPERADMIN:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
