import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import '@/models/User';
import mongoose from 'mongoose';

function validateObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function ensureProfessorOwner(classroomId: string, userId: string) {
  const classroom = await Classroom.findOne({
    _id: classroomId,
    professor: userId,
    isActive: true,
  });
  return classroom;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    if (!validateObjectId(id)) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    await connectDB();

    let userObjectId: mongoose.Types.ObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(session.user.id);
    } catch (e: any) {
      return NextResponse.json({ error: 'ID do usuário inválido' }, { status: 400 });
    }

    // Buscar turma e verificar se o usuário tem acesso
    let classroom;
    if (session.user.role === 'superadmin' || session.user.role === 'professor') {
      // Professores veem apenas suas próprias turmas (exceto superadmin)
      if (session.user.role === 'superadmin') {
        classroom = await Classroom.findById(id)
          .populate('students', 'name email')
          .populate('professor', 'name email');
      } else {
        classroom = await Classroom.findOne({
          _id: id,
          professor: userObjectId,
        })
          .populate('students', 'name email')
          .populate('professor', 'name email');
      }
    } else if (session.user.role === 'aluno') {
      // Alunos veem turmas em que estão matriculados
      classroom = await Classroom.findOne({
        _id: id,
        students: userObjectId,
        isActive: true,
      })
        .populate('students', 'name email')
        .populate('professor', 'name email');
    } else {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (!classroom) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ classroom });
  } catch (error: any) {
    console.error('Erro ao carregar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', debug: error?.message || error?.toString() },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = params;
    if (!validateObjectId(id)) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome da turma é obrigatório' }, { status: 400 });
    }

    await connectDB();

    const classroom = await ensureProfessorOwner(id, session.user.id);

    if (!classroom) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 });
    }

    classroom.name = name.trim();
    classroom.description = description?.trim() || '';
    await classroom.save();

    return NextResponse.json({
      success: true,
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        description: classroom.description,
        inviteCode: classroom.inviteCode,
      },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', debug: error?.message || error?.toString() },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { id } = params;
    if (!validateObjectId(id)) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    await connectDB();

    const classroom = await ensureProfessorOwner(id, session.user.id);

    if (!classroom) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 });
    }

    await Classroom.deleteOne({ _id: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', debug: error?.message || error?.toString() },
      { status: 500 }
    );
  }
}

