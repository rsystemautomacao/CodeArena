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

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da turma é obrigatório' },
        { status: 400 }
      );
    }

    await connectDB();

    // Gerar código de convite único
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existingClassroom = await Classroom.findOne({ inviteCode });
      if (!existingClassroom) {
        isUnique = true;
      }
    }

    const classroom = await Classroom.create({
      name,
      description,
      professor: session.user.id,
      students: [],
      inviteCode: inviteCode!,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        description: classroom.description,
        inviteCode: classroom.inviteCode,
        students: classroom.students,
        createdAt: classroom.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', debug: error?.message || error?.toString() },
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

    await connectDB();

    let classrooms;

    if (session.user.role === 'professor') {
      // Professores veem suas próprias turmas
      classrooms = await Classroom.find({ 
        professor: session.user.id,
        isActive: true 
      })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    } else if (session.user.role === 'aluno') {
      // Alunos veem turmas em que estão matriculados
      const studentObjectId = new mongoose.Types.ObjectId(session.user.id);
      classrooms = await Classroom.find({ 
        students: studentObjectId,
        isActive: true 
      })
      .populate('professor', 'name email')
      .sort({ createdAt: -1 });
    } else {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json({ classrooms });
  } catch (error: any) {
    console.error('Erro ao buscar turmas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', debug: error?.message || error?.toString() },
      { status: 500 }
    );
  }
}
