import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🧪 TESTE FLUXO DE AUTENTICAÇÃO:', {
      timestamp: new Date().toISOString(),
      email,
      password: password ? 'FORNECIDA' : 'FALTANDO'
    });

    // Simular exatamente o que acontece no authorize
    const envEmail = process.env.SUPERADMIN_EMAIL;
    const envPassword = process.env.SUPERADMIN_PASSWORD;
    
    const emailMatch = email === envEmail;
    const passwordMatch = password === envPassword;
    
    const result = {
      timestamp: new Date().toISOString(),
      test: 'AUTH FLOW TEST',
      
      credentials: {
        email,
        password: password ? 'FORNECIDA' : 'FALTANDO',
        passwordLength: password?.length || 0
      },
      
      environment: {
        envEmail,
        envPassword: envPassword ? 'CONFIGURADA' : 'FALTANDO',
        envPasswordLength: envPassword?.length || 0
      },
      
      comparison: {
        emailMatch,
        passwordMatch,
        emailExact: `"${email}" === "${envEmail}"`,
        passwordExact: `"${password}" === "${envPassword}"`
      },
      
      // Simular o que seria retornado pelo authorize
      authorizeResult: emailMatch && passwordMatch ? {
        id: 'superadmin-test',
        name: 'Super Admin',
        email: email,
        role: 'superadmin',
      } : null,
      
      // Simular o que aconteceria no callback signIn
      signInCallback: emailMatch && passwordMatch ? {
        wouldReturn: true,
        reason: 'user.role === "superadmin"'
      } : {
        wouldReturn: false,
        reason: 'user is null (authorize failed)'
      }
    };

    console.log('🔍 RESULTADO TESTE AUTH FLOW:', JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE AUTH FLOW:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
