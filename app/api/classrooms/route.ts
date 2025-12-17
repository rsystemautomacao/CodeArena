import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Importar modelos para garantir que estejam registrados
import '@/models/User';
import '@/models/Classroom';

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

    if (!Classroom) {
      console.error('Erro: Modelo Classroom não encontrado');
      return NextResponse.json(
        { error: 'Erro ao carregar modelo do banco de dados' },
        { status: 500 }
      );
    }

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

    // Converter ID do professor para ObjectId
    let professorObjectId: mongoose.Types.ObjectId;
    try {
      professorObjectId = new mongoose.Types.ObjectId(session.user.id);
    } catch (e: any) {
      console.error('Erro ao converter ID do professor:', e);
      return NextResponse.json(
        { error: 'ID do professor inválido' },
        { status: 400 }
      );
    }

    const classroom = await Classroom.create({
      name,
      description,
      professor: professorObjectId,
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

    console.log('🔍 GET CLASSROOMS - Sessão recebida:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    });

    if (!session || !session.user) {
      console.error('❌ GET CLASSROOMS: Sessão não encontrada');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      console.error('❌ GET CLASSROOMS: Session user ID não encontrado:', {
        sessionUser: session.user,
        sessionUserEmail: session.user.email,
        sessionUserRole: session.user.role
      });
      return NextResponse.json(
        { error: 'ID do usuário não encontrado na sessão' },
        { status: 400 }
      );
    }

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

    if (!Classroom) {
      console.error('Erro: Modelo Classroom não encontrado');
      return NextResponse.json(
        { error: 'Erro ao carregar modelo do banco de dados' },
        { status: 500 }
      );
    }

    let classrooms;

    if (session.user.role === 'professor') {
      // Professores veem suas próprias turmas
      try {
        let professorObjectId: mongoose.Types.ObjectId;
        try {
          professorObjectId = new mongoose.Types.ObjectId(session.user.id);
        } catch (e: any) {
          console.error('Erro ao converter ID do professor:', e);
          return NextResponse.json(
            { error: 'ID do professor inválido' },
            { status: 400 }
          );
        }
        
        classrooms = await Classroom.find({ 
          professor: professorObjectId,
          isActive: true 
        })
        .populate('students', 'name email')
        .sort({ createdAt: -1 });
      } catch (e: any) {
        console.error('Erro ao buscar turmas do professor:', e);
        return NextResponse.json(
          { error: 'Erro ao buscar turmas' },
          { status: 500 }
        );
      }
    } else if (session.user.role === 'aluno') {
      // Alunos veem turmas em que estão matriculados
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
        classrooms = await Classroom.find({ 
          students: studentObjectId,
          isActive: true 
        })
        .populate('professor', 'name email')
        .sort({ createdAt: -1 });
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

    return NextResponse.json({ classrooms: classrooms || [] });
  } catch (error: any) {
    console.error('Erro ao buscar turmas:', error);
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
