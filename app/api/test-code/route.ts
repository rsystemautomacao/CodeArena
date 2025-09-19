import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testCode } from '@/lib/judge0';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { code, language, input, timeLimit = 2, memoryLimit = 128 } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Código e linguagem são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await testCode(code, language, input || '', timeLimit, memoryLimit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao executar código' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: result.result,
    });
  } catch (error: any) {
    console.error('Erro ao testar código:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
