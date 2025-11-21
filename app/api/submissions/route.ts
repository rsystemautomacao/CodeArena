import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submitCode } from '@/lib/judge0';
import { validateLanguageMatch, validateBasicSyntax } from '@/lib/validate-language';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Importar modelos para garantir que estejam registrados
import '@/models/User';
import '@/models/Exercise';
import '@/models/Submission';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { exerciseId, code, language, assignmentId } = await request.json();

    if (!exerciseId || !code || !language) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    // Validar que o código não está apenas com template vazio
    const trimmedCode = code.trim();
    const languageTemplates = {
      python: '# Escreva seu código Python aqui',
      java: '// Escreva seu código Java aqui',
      c: '// Escreva seu código C aqui',
      cpp: '// Escreva seu código C++ aqui',
      javascript: '// Escreva seu código JavaScript aqui'
    };
    
    const template = languageTemplates[language as keyof typeof languageTemplates];
    if (!template || trimmedCode === template || trimmedCode.length < 10) {
      return NextResponse.json(
        { error: 'Por favor, escreva um código válido antes de submeter. O código não pode estar vazio ou apenas com comentários.' },
        { status: 400 }
      );
    }

    // CRÍTICO: Validar que o código corresponde à linguagem selecionada
    const languageValidation = validateLanguageMatch(code, language);
    if (!languageValidation.isValid) {
      console.error('❌ VALIDAÇÃO DE LINGUAGEM FALHOU:', {
        selectedLanguage: language,
        codePreview: code.substring(0, 100),
        error: languageValidation.error
      });
      return NextResponse.json(
        { error: languageValidation.error || 'O código não corresponde à linguagem selecionada. Por favor, selecione a linguagem correta ou corrija o código.' },
        { status: 400 }
      );
    }

    // Validar sintaxe básica
    const syntaxValidation = validateBasicSyntax(code, language);
    if (!syntaxValidation.isValid) {
      console.error('❌ VALIDAÇÃO DE SINTAXE FALHOU:', {
        language,
        error: syntaxValidation.error
      });
      return NextResponse.json(
        { error: syntaxValidation.error || 'Código com sintaxe inválida' },
        { status: 400 }
      );
    }

    await connectDB();

    // Garantir que os modelos estão registrados
    const Exercise = (await import('@/models/Exercise')).default;
    const Submission = (await import('@/models/Submission')).default;

    // Buscar o exercício
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise || !exercise.isActive) {
      return NextResponse.json(
        { error: 'Exercício não encontrado' },
        { status: 404 }
      );
    }

    // Criar submissão no banco
    let userObjectId: mongoose.Types.ObjectId;
    let exerciseObjectId: mongoose.Types.ObjectId;
    let assignmentObjectId: mongoose.Types.ObjectId | null = null;
    
    try {
      userObjectId = new mongoose.Types.ObjectId(session.user.id);
      exerciseObjectId = new mongoose.Types.ObjectId(exerciseId);
      if (assignmentId) {
        assignmentObjectId = new mongoose.Types.ObjectId(assignmentId);
      }
    } catch (e: any) {
      console.error('Erro ao converter IDs:', e);
      return NextResponse.json(
        { error: 'ID inválido fornecido' },
        { status: 400 }
      );
    }
    
    const submission = await Submission.create({
      user: userObjectId,
      exercise: exerciseObjectId,
      assignment: assignmentObjectId,
      code,
      language,
      status: 'pending',
      submittedAt: new Date(),
    });

    // Executar código com Judge0
    const testCases = exercise.testCases.map((tc: any) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

    if (!testCases || testCases.length === 0) {
      await Submission.findByIdAndUpdate(submission._id, {
        status: 'wrong_answer',
        result: {
          status: 'wrong_answer',
          message: 'Exercício não possui casos de teste válidos',
        },
      });

      return NextResponse.json(
        { error: 'Exercício não possui casos de teste válidos' },
        { status: 400 }
      );
    }

    const result = await submitCode(
      code,
      language,
      testCases,
      exercise.timeLimit,
      exercise.memoryLimit
    );

    if (!result.success) {
      // Atualizar submissão com erro
      await Submission.findByIdAndUpdate(submission._id, {
        status: 'runtime_error',
        result: {
          status: 'runtime_error',
          message: result.error || 'Erro interno',
        },
      });

      return NextResponse.json(
        { error: result.error || 'Erro ao executar código' },
        { status: 500 }
      );
    }

    if (!result.results || result.results.length === 0) {
      await Submission.findByIdAndUpdate(submission._id, {
        status: 'runtime_error',
        result: {
          status: 'runtime_error',
          message: 'Nenhum resultado retornado do Judge0',
        },
      });

      return NextResponse.json(
        { error: 'Nenhum resultado retornado do Judge0' },
        { status: 500 }
      );
    }

    // Determinar status final baseado nos resultados
    // CRÍTICO: TODOS os testes devem passar para aceitar
    let finalStatus = 'accepted';
    let finalMessage = 'Resposta correta';
    let passedTests = 0;
    let totalTests = result.results.length;
    let hasCompilationError = false;

    // Verificar se TODOS os testes passaram
    for (const testResult of result.results) {
      // Se houver erro de compilação em QUALQUER teste, rejeitar imediatamente
      if (testResult.status === 'compilation_error') {
        hasCompilationError = true;
        finalStatus = 'compilation_error';
        finalMessage = testResult.message || 'Erro de compilação - verifique se o código está na linguagem correta';
        break;
      }
      
      if (testResult.status === 'accepted') {
        passedTests++;
      } else {
        // Se qualquer teste falhar, a submissão é rejeitada
        finalStatus = testResult.status;
        finalMessage = `Teste ${testResult.testCase} falhou: ${testResult.message}`;
        if (testResult.output && testResult.expectedOutput) {
          finalMessage += `\nSaída obtida: ${testResult.output.trim()}\nSaída esperada: ${testResult.expectedOutput.trim()}`;
        }
        break; // Primeiro erro encontrado
      }
    }

    // Se nem todos os testes passaram ou há erro de compilação, a submissão é rejeitada
    if (hasCompilationError || passedTests < totalTests) {
      if (!hasCompilationError) {
        finalStatus = 'wrong_answer';
        if (finalMessage === 'Resposta correta') {
          finalMessage = `Apenas ${passedTests} de ${totalTests} testes passaram`;
        }
      }
    }

    // Atualizar submissão com resultado
    await Submission.findByIdAndUpdate(submission._id, {
      status: finalStatus,
      result: {
        status: finalStatus,
        message: finalMessage,
        testCases: {
          passed: passedTests,
          total: result.results.length,
        },
        time: result.results[0]?.time,
        memory: result.results[0]?.memory,
      },
    });

    return NextResponse.json({
      success: true,
      submissionId: submission._id,
      status: finalStatus,
      message: finalMessage,
      testResults: result.results,
      passedTests,
      totalTests: result.results.length,
    });
  } catch (error: any) {
    console.error('Erro na submissão:', error);
    console.error('Stack trace:', error?.stack);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        debug: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      console.error('Session user ID não encontrado:', session.user);
      return NextResponse.json(
        { error: 'ID do usuário não encontrado na sessão' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const assignmentId = searchParams.get('assignmentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const dbConnection = await connectDB();
    if (!dbConnection) {
      console.error('Erro: Não foi possível conectar ao banco de dados');
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados' },
        { status: 500 }
      );
    }

    // Garantir que os modelos estão registrados
    const Submission = (await import('@/models/Submission')).default;

    if (!Submission) {
      console.error('Erro: Modelo Submission não encontrado');
      return NextResponse.json(
        { error: 'Erro ao carregar modelo do banco de dados' },
        { status: 500 }
      );
    }

    let userObjectId: mongoose.Types.ObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(session.user.id);
    } catch (e: any) {
      console.error('Erro ao converter ID do usuário:', e);
      return NextResponse.json(
        { error: 'ID do usuário inválido' },
        { status: 400 }
      );
    }

    const query: any = { user: userObjectId };
    
    if (exerciseId) {
      try {
        query.exercise = new mongoose.Types.ObjectId(exerciseId);
      } catch (e: any) {
        console.error('Erro ao converter exerciseId:', e);
        return NextResponse.json(
          { error: 'ID do exercício inválido' },
          { status: 400 }
        );
      }
    }
    
    if (assignmentId) {
      try {
        query.assignment = new mongoose.Types.ObjectId(assignmentId);
      } catch (e: any) {
        console.error('Erro ao converter assignmentId:', e);
        return NextResponse.json(
          { error: 'ID da atividade inválido' },
          { status: 400 }
        );
      }
    }

    try {
      const submissions = await Submission.find(query)
        .populate('exercise', 'title')
        .populate('assignment', 'title')
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Submission.countDocuments(query);

      return NextResponse.json({
        submissions: submissions || [],
        pagination: {
          page,
          limit,
          total: total || 0,
          pages: Math.ceil((total || 0) / limit),
        },
      });
    } catch (e: any) {
      console.error('Erro ao buscar submissões do banco:', e);
      return NextResponse.json(
        { error: 'Erro ao buscar submissões' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao buscar submissões:', error);
    console.error('Stack trace:', error?.stack);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        debug: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
