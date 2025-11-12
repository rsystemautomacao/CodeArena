import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submitCode } from '@/lib/judge0';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { code, language, testCases, timeLimit = 2, memoryLimit = 128 } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Código e linguagem são obrigatórios' },
        { status: 400 }
      );
    }

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { error: 'Casos de teste são obrigatórios' },
        { status: 400 }
      );
    }

    // Testar código contra todos os casos de teste
    const result = await submitCode(code, language, testCases, timeLimit, memoryLimit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao executar código' },
        { status: 500 }
      );
    }

    // Verificar se todos os testes passaram
    const allPassed = result.results.every(r => r.status === 'accepted');

    return NextResponse.json({
      success: true,
      allPassed,
      results: result.results,
    });
  } catch (error: any) {
    console.error('Erro ao testar exercício:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', debug: error.message },
      { status: 500 }
    );
  }
}

