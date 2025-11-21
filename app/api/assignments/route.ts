import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Importar modelos para garantir que estejam registrados
import '@/models/User';
import '@/models/Classroom';
import '@/models/Exercise';
import '@/models/Assignment';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Apenas professores podem criar atividades' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      classroomId,
      exerciseIds,
      type,
      startDate,
      endDate,
      timeLimit,
    } = await request.json();

    if (!title || !classroomId || !exerciseIds || !Array.isArray(exerciseIds) || exerciseIds.length === 0) {
      return NextResponse.json(
        { error: 'Título, turma e exercícios são obrigatórios' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Datas de início e término são obrigatórias' },
        { status: 400 }
      );
    }

    if (type === 'prova' && (!timeLimit || Number(timeLimit) <= 0)) {
      return NextResponse.json(
        { error: 'Defina um limite de tempo válido para provas' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { error: 'Período inválido: a data de término deve ser posterior à de início' },
        { status: 400 }
      );
    }

    await connectDB();

    // Garantir que os modelos estão registrados
    const Classroom = (await import('@/models/Classroom')).default;
    const Exercise = (await import('@/models/Exercise')).default;
    const Assignment = (await import('@/models/Assignment')).default;

    const classroom = await Classroom.findOne({
      _id: classroomId,
      professor: session.user.id,
      isActive: true,
    });

    if (!classroom) {
      return NextResponse.json(
        { error: 'Turma não encontrada ou você não possui permissão para utilizá-la' },
        { status: 404 }
      );
    }

    const uniqueExerciseIds = Array.from(new Set(exerciseIds));
    const exercises = await Exercise.find({
      _id: { $in: uniqueExerciseIds },
      createdBy: session.user.id,
      isActive: true,
    }).select('_id');

    if (exercises.length !== uniqueExerciseIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais exercícios selecionados não existem ou não pertencem a você' },
        { status: 400 }
      );
    }

    const assignment = await Assignment.create({
      title,
      description,
      classroom: classroomId,
      exercises: uniqueExerciseIds,
      type: type || 'lista',
      startDate: start,
      endDate: end,
      timeLimit: type === 'prova' ? timeLimit : undefined,
      createdBy: session.user.id,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        type: assignment.type,
        classroom: classroom._id,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        timeLimit: assignment.timeLimit,
        exercises: assignment.exercises,
        createdAt: assignment.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar atividade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    const classroomId = searchParams.get('classroomId');

    const dbConnection = await connectDB();
    if (!dbConnection) {
      console.error('Erro: Não foi possível conectar ao banco de dados');
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados' },
        { status: 500 }
      );
    }

    // Garantir que os modelos estão registrados
    const Classroom = (await import('@/models/Classroom')).default;
    const Assignment = (await import('@/models/Assignment')).default;

    if (!Classroom || !Assignment) {
      console.error('Erro: Modelos não encontrados');
      return NextResponse.json(
        { error: 'Erro ao carregar modelos do banco de dados' },
        { status: 500 }
      );
    }

    let assignmentsQuery: any = { isActive: true };

    if (session.user.role === 'professor') {
      assignmentsQuery.createdBy = session.user.id;
      if (classroomId) {
        try {
          assignmentsQuery.classroom = new mongoose.Types.ObjectId(classroomId);
        } catch (e: any) {
          console.error('Erro ao converter classroomId:', e);
          return NextResponse.json(
            { error: 'ID da turma inválido' },
            { status: 400 }
          );
        }
      }
    } else if (session.user.role === 'aluno') {
      let studentObjectId: mongoose.Types.ObjectId;
      try {
        studentObjectId = new mongoose.Types.ObjectId(session.user.id);
      } catch (e: any) {
        console.error('Erro ao converter ID do aluno:', e);
        return NextResponse.json(
          { error: 'ID do aluno inválido' },
          { status: 400 }
        );
      }

      try {
        const classrooms = await Classroom.find({
          students: studentObjectId,
          isActive: true,
        }).select('_id');

        const classroomIds = classrooms.map((item) => item._id);

        if (classroomIds.length === 0) {
          return NextResponse.json({ assignments: [] });
        }

        assignmentsQuery.classroom = { $in: classroomIds };

        if (classroomId) {
          const foundClassroom = classroomIds.find((id) => id.toString() === classroomId);
          if (foundClassroom) {
            assignmentsQuery.classroom = foundClassroom;
          }
        }
      } catch (e: any) {
        console.error('Erro ao buscar turmas do aluno:', e);
        return NextResponse.json(
          { error: 'Erro ao buscar turmas' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    try {
      const assignments = await Assignment.find(assignmentsQuery)
        .populate('classroom', 'name inviteCode')
        .populate('exercises', 'title difficulty tags')
        .sort({ startDate: 1 });

      return NextResponse.json({ assignments: assignments || [] });
    } catch (e: any) {
      console.error('Erro ao buscar atividades:', e);
      return NextResponse.json(
        { error: 'Erro ao buscar atividades' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao listar atividades:', error);
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

