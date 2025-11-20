import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Assignment from '@/models/Assignment';
import Classroom from '@/models/Classroom';
import Exercise from '@/models/Exercise';
import mongoose from 'mongoose';

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

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    await connectDB();

    let assignmentsQuery: any = { isActive: true };

    if (session.user.role === 'professor') {
      assignmentsQuery.createdBy = session.user.id;
      if (classroomId) {
        assignmentsQuery.classroom = classroomId;
      }
    } else if (session.user.role === 'aluno') {
      const studentObjectId = new mongoose.Types.ObjectId(session.user.id);
      const classrooms = await Classroom.find({
        students: studentObjectId,
        isActive: true,
      }).select('_id');

      const classroomIds = classrooms.map((item) => item._id);

      assignmentsQuery.classroom = { $in: classroomIds };

      if (classroomId && classroomIds.find((id) => id.toString() === classroomId)) {
        assignmentsQuery.classroom = classroomId;
      }
    } else {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const assignments = await Assignment.find(assignmentsQuery)
      .populate('classroom', 'name inviteCode')
      .populate('exercises', 'title difficulty tags')
      .sort({ startDate: 1 });

    return NextResponse.json({ assignments });
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

