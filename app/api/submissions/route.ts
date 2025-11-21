import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submitCode } from '@/lib/judge0';
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

    // Determinar status final baseado nos resultados
    let finalStatus = 'accepted';
    let finalMessage = 'Resposta correta';
    let passedTests = 0;

    for (const testResult of result.results) {
      if (testResult.status === 'accepted') {
        passedTests++;
      } else {
        finalStatus = testResult.status;
        finalMessage = testResult.message;
        break; // Primeiro erro encontrado
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
