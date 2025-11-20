import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Classroom from '@/models/Classroom';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'aluno') {
      return NextResponse.json(
        { error: 'Apenas alunos podem entrar em turmas' },
        { status: 403 }
      );
    }

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Código de convite é obrigatório' },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar turma pelo código de convite
    const classroom = await Classroom.findOne({ 
      inviteCode: inviteCode.toUpperCase(),
      isActive: true 
    });

    if (!classroom) {
      return NextResponse.json(
        { error: 'Código de convite inválido' },
        { status: 404 }
      );
    }

    // Verificar se o aluno já está na turma
    const studentObjectId = new mongoose.Types.ObjectId(session.user.id);
    const isAlreadyEnrolled = classroom.students.some((studentId: any) => 
      studentId.toString() === session.user.id
    );

    if (isAlreadyEnrolled) {
      return NextResponse.json(
        { error: 'Você já está matriculado nesta turma' },
        { status: 400 }
      );
    }

    // Adicionar aluno à turma
    await Classroom.findByIdAndUpdate(classroom._id, {
      $push: { students: studentObjectId }
    });

    return NextResponse.json({
      success: true,
      message: 'Você entrou na turma com sucesso!',
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        description: classroom.description,
      },
    });
  } catch (error: any) {
    console.error('Erro ao entrar na turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
