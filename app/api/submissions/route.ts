import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submitCode } from '@/lib/judge0';
import connectDB from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Exercise from '@/models/Exercise';

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

    // Buscar o exercício
    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercício não encontrado' },
        { status: 404 }
      );
    }

    // Criar submissão no banco
    const submission = await Submission.create({
      user: session.user.id,
      exercise: exerciseId,
      assignment: assignmentId || null,
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');
    const assignmentId = searchParams.get('assignmentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    await connectDB();

    const query: any = { user: session.user.id };
    if (exerciseId) query.exercise = exerciseId;
    if (assignmentId) query.assignment = assignmentId;

    const submissions = await Submission.find(query)
      .populate('exercise', 'title')
      .populate('assignment', 'title')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Submission.countDocuments(query);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar submissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
