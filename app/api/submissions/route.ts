import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submitCode } from '@/lib/judge0';
import { validateLanguageMatch, validateBasicSyntax } from '@/lib/validate-language';
import { validateLabIP } from '@/lib/ip-validation';
import { checkSessionValid } from '@/lib/validate-session';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Importar modelos para garantir que estejam registrados
import '@/models/User';
import '@/models/Exercise';
import '@/models/Submission';
import '@/models/Assignment';

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

    // Alunos devem ter o perfil completo antes de submeter
    if (session.user.role === 'aluno' && session.user.profileCompleted === false) {
      return NextResponse.json(
        { error: 'Você precisa completar seu perfil antes de submeter soluções.', profileIncomplete: true },
        { status: 403 }
      );
    }

    // Limite de tamanho do código: 64 KB
    const MAX_CODE_SIZE = 64 * 1024; // 64 KB em bytes
    if (Buffer.byteLength(code, 'utf8') > MAX_CODE_SIZE) {
      return NextResponse.json(
        { error: 'O código submetido é muito grande. O tamanho máximo permitido é 64 KB.' },
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
    const Assignment = (await import('@/models/Assignment')).default;

    // Buscar o exercício
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise || !exercise.isActive) {
      return NextResponse.json(
        { error: 'Exercício não encontrado' },
        { status: 404 }
      );
    }

    // VALIDAÇÃO DE ACESSO PARA PROVAS E LISTAS
    if (assignmentId) {
      const assignment = await Assignment.findById(assignmentId);

      if (!assignment || !assignment.isActive) {
        return NextResponse.json(
          { error: 'Atividade não encontrada ou inativa.' },
          { status: 404 }
        );
      }

      // Verificar se a atividade está dentro do período permitido
      const now = new Date();
      if (now < new Date(assignment.startDate)) {
        return NextResponse.json(
          { error: 'Esta atividade ainda não foi aberta. Aguarde o início.' },
          { status: 403 }
        );
      }
      if (now > new Date(assignment.endDate)) {
        return NextResponse.json(
          { error: 'O prazo desta atividade já encerrou. Submissões não são mais aceitas.' },
          { status: 403 }
        );
      }

      if (assignment.type === 'prova') {
        // VALIDAÇÃO DE SESSÃO ÚNICA: Verificar se a sessão do aluno está ativa
        if (session.user.role === 'aluno') {
          const sessionValid = await checkSessionValid(session.user.id);
          if (!sessionValid) {
            return NextResponse.json(
              { 
                error: 'Sua sessão foi invalidada. Outro login foi detectado. Faça login novamente.',
                sessionExpired: true
              },
              { status: 401 }
            );
          }
        }
        
        const userObjectId = new mongoose.Types.ObjectId(session.user.id);
        
        // Verificar se o aluno está habilitado (se houver lista de alunos habilitados)
        if (assignment.enabledStudents && assignment.enabledStudents.length > 0) {
          const isEnabled = assignment.enabledStudents.some(
            (enabledId: mongoose.Types.ObjectId) => enabledId.toString() === userObjectId.toString()
          );
          
          if (!isEnabled) {
            return NextResponse.json(
              { 
                error: 'Você não está habilitado para realizar esta prova. Entre em contato com o professor.',
                accessDenied: true,
                reason: 'not_enabled'
              },
              { status: 403 }
            );
          }
        }
        
        // Verificar IP do laboratório (se configurado)
        if (assignment.requireLabIP && assignment.allowedIPRanges && assignment.allowedIPRanges.length > 0) {
          const ipValidation = validateLabIP(request, assignment.allowedIPRanges);
          
          if (!ipValidation.isValid) {
            console.log('🚫 ACESSO NEGADO POR IP:', {
              clientIP: ipValidation.clientIP,
              reason: ipValidation.reason,
              allowedRanges: assignment.allowedIPRanges,
              userId: session.user.id,
              assignmentId: assignmentId
            });
            
            return NextResponse.json(
              { 
                error: `Acesso negado: ${ipValidation.reason}. Esta prova só pode ser realizada na rede do laboratório de informática.`,
                accessDenied: true,
                reason: 'ip_not_allowed',
                clientIP: ipValidation.clientIP
              },
              { status: 403 }
            );
          }
          
          console.log('✅ ACESSO PERMITIDO POR IP:', {
            clientIP: ipValidation.clientIP,
            userId: session.user.id,
            assignmentId: assignmentId
          });
        }
      }
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
      isHidden: tc.isHidden === true,
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
        const isHiddenTest = testCases[result.results.indexOf(testResult)]?.isHidden === true;
        finalMessage = `Teste ${testResult.testCase} falhou: ${testResult.message}`;
        // Exibir detalhes de diff SOMENTE para casos visíveis (não ocultos)
        if (!isHiddenTest && testResult.output && testResult.expectedOutput) {
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

    // Buscar mensagem de erro de compilação detalhada se houver
    let compilationErrorDetails = '';
    if (hasCompilationError) {
      const compilationResult = result.results.find(r => r.status === 'compilation_error');
      if (compilationResult) {
        compilationErrorDetails = compilationResult.message || compilationResult.output || '';
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
        compilationError: hasCompilationError ? compilationErrorDetails : undefined,
      },
    });

    // CRÍTICO: Se houver erro de compilação ou qualquer erro, retornar success: false
    const isAccepted = finalStatus === 'accepted' && !hasCompilationError && passedTests === totalTests;

    // Sanitizar os resultados antes de enviar ao cliente:
    // - Casos ocultos (isHidden) não devem expor expectedOutput nem o output do aluno
    const sanitizedTestResults = result.results.map((r, i) => {
      const isHidden = testCases[i]?.isHidden === true;
      if (isHidden) {
        return {
          testCase: r.testCase,
          status: r.status,
          message: r.status === 'accepted' ? 'Caso de teste oculto: correto' : 'Caso de teste oculto: incorreto',
          time: r.time,
          memory: r.memory,
          // output, expectedOutput e compilationError OMITIDOS para casos ocultos
        };
      }
      return r;
    });

    return NextResponse.json({
      success: isAccepted,
      submissionId: submission._id,
      status: finalStatus,
      message: finalMessage,
      testResults: sanitizedTestResults,
      passedTests,
      totalTests: result.results.length,
      error: !isAccepted ? (hasCompilationError ? `Erro de compilação: ${compilationErrorDetails || finalMessage}` : finalMessage) : undefined,
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
    const MAX_PAGE_LIMIT = 100;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '10')));

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
