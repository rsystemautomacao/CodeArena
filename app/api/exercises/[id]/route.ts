import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectDB();

    const exercise = await Exercise.findById(params.id)
      .populate('createdBy', 'name');

    if (!exercise || !exercise.isActive) {
      return NextResponse.json(
        { error: 'Exercício não encontrado' },
        { status: 404 }
      );
    }

    // Para alunos, não retornar casos de teste ocultos
    const exerciseData = {
      _id: exercise._id,
      title: exercise.title,
      description: exercise.description,
      examples: exercise.examples,
      timeLimit: exercise.timeLimit,
      memoryLimit: exercise.memoryLimit,
      difficulty: exercise.difficulty,
      tags: exercise.tags,
      createdBy: exercise.createdBy,
      createdAt: exercise.createdAt,
    };

    // Se for professor ou superadmin, incluir casos de teste
    if (session.user.role === 'professor' || session.user.role === 'superadmin') {
      (exerciseData as any).testCases = exercise.testCases;
    }

    return NextResponse.json({ exercise: exerciseData });
  } catch (error: any) {
    console.error('Erro ao buscar exercício:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Apenas professores podem editar exercícios' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      examples,
      testCases,
      timeLimit,
      memoryLimit,
      difficulty,
      tags,
    } = await request.json();

    await connectDB();

    const exercise = await Exercise.findById(params.id);

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercício não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o professor é o criador do exercício
    if (exercise.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Você só pode editar seus próprios exercícios' },
        { status: 403 }
      );
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(
      params.id,
      {
        title,
        description,
        examples,
        testCases,
        timeLimit,
        memoryLimit,
        difficulty,
        tags,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      exercise: updatedExercise,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar exercício:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Apenas professores podem excluir exercícios' },
        { status: 403 }
      );
    }

    await connectDB();

    const exercise = await Exercise.findById(params.id);

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercício não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o professor é o criador do exercício
    if (exercise.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Você só pode excluir seus próprios exercícios' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como inativo
    await Exercise.findByIdAndUpdate(params.id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Exercício excluído com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao excluir exercício:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
