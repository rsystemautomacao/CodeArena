import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Forçar carregamento das variáveis de ambiente
    const envEmail = process.env.SUPERADMIN_EMAIL || 'VARIÁVEL_NÃO_CARREGADA';
    const envPassword = process.env.SUPERADMIN_PASSWORD || 'VARIÁVEL_NÃO_CARREGADA';
    
    console.log('🧪 TESTE SUPERADMIN LOGIN:', {
      timestamp: new Date().toISOString(),
      provided: {
        email,
        password: password ? 'FORNECIDA' : 'FALTANDO',
        passwordLength: password?.length || 0
      },
      environment: {
        envEmail,
        envPassword: envPassword !== 'VARIÁVEL_NÃO_CARREGADA' ? 'CONFIGURADA' : 'FALTANDO',
        envPasswordLength: envPassword !== 'VARIÁVEL_NÃO_CARREGADA' ? envPassword.length : 0,
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPERADMIN'))
      },
      comparison: {
        emailMatch: email === process.env.SUPERADMIN_EMAIL,
        passwordMatch: password === process.env.SUPERADMIN_PASSWORD,
        emailExact: `"${email}" === "${process.env.SUPERADMIN_EMAIL}"`,
        passwordExact: `"${password}" === "${process.env.SUPERADMIN_PASSWORD}"`
      }
    });

    // Teste detalhado das credenciais
    const emailMatch = email === envEmail;
    const passwordMatch = password === envPassword;
    
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
        envEmail,
        envPassword: envPassword !== 'VARIÁVEL_NÃO_CARREGADA' ? 'CONFIGURADA' : 'FALTANDO',
        envPasswordLength: envPassword !== 'VARIÁVEL_NÃO_CARREGADA' ? envPassword.length : 0,
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPERADMIN'))
      },
      
      // Comparações detalhadas
      comparison: {
        emailMatch,
        passwordMatch,
        emailExact: `"${email}" === "${envEmail}"`,
        passwordExact: `"${password}" === "${envPassword}"`,
        emailChars: {
          provided: email?.split('').map((c: string, i: number) => `${i}: '${c}' (${c.charCodeAt(0)})`),
          env: envEmail?.split('').map((c: string, i: number) => `${i}: '${c}' (${c.charCodeAt(0)})`)
        },
        passwordChars: {
          provided: password?.split('').map((c: string, i: number) => `${i}: '${c}' (${c.charCodeAt(0)})`),
          env: envPassword?.split('').map((c: string, i: number) => `${i}: '${c}' (${c.charCodeAt(0)})`)
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
