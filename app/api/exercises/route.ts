import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Exercise from '@/models/Exercise';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Apenas professores podem criar exercícios' },
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

    if (!title || !description || !testCases || testCases.length === 0) {
      return NextResponse.json(
        { error: 'Título, descrição e casos de teste são obrigatórios' },
        { status: 400 }
      );
    }

    await connectDB();

    const exercise = await Exercise.create({
      title,
      description,
      examples: examples || [],
      testCases,
      timeLimit: timeLimit || 2,
      memoryLimit: memoryLimit || 128,
      difficulty: difficulty || 'facil',
      tags: tags || [],
      createdBy: session.user.id,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      exercise: {
        _id: exercise._id,
        title: exercise.title,
        description: exercise.description,
        examples: exercise.examples,
        timeLimit: exercise.timeLimit,
        memoryLimit: exercise.memoryLimit,
        difficulty: exercise.difficulty,
        tags: exercise.tags,
        createdAt: exercise.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar exercício:', error);
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const difficulty = searchParams.get('difficulty');
    const tag = searchParams.get('tag');

    await connectDB();

    const query: any = { isActive: true };
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }

    const exercises = await Exercise.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-testCases'); // Não retornar casos de teste para alunos

    const total = await Exercise.countDocuments(query);

    return NextResponse.json({
      exercises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Erro ao buscar exercícios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
