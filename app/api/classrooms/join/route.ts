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

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'aluno') {
      return NextResponse.json(
        { error: 'Apenas alunos podem entrar em turmas' },
        { status: 403 }
      );
    }

    // DEBUG: Log completo da sessão
    console.log('🔍 DEBUG SESSÃO COMPLETA:', {
      hasSession: !!session,
      hasUser: !!session.user,
      userId: session.user?.id,
      userEmail: session.user?.email,
      userRole: session.user?.role,
      sessionComplete: JSON.stringify(session, null, 2)
    });

    if (!session.user.id) {
      console.error('❌ Session user ID não encontrado:', session.user);
      console.error('❌ Tentando buscar ID do banco por email...');
      
      // Tentar buscar ID do banco por email como fallback
      try {
        await connectDB();
        const User = (await import('@/models/User')).default;
        const dbUser = await User.findOne({ email: session.user.email }).select('_id');
        
        if (dbUser) {
          // Atualizar session.user.id temporariamente
          (session.user as any).id = dbUser._id.toString();
          console.log('✅ ID RECUPERADO DO BANCO:', dbUser._id.toString());
        } else {
          return NextResponse.json(
            { error: 'ID do usuário não encontrado na sessão e no banco de dados' },
            { status: 400 }
          );
        }
      } catch (e: any) {
        console.error('❌ Erro ao buscar ID do banco:', e);
        return NextResponse.json(
          { error: 'ID do usuário não encontrado na sessão' },
          { status: 400 }
        );
      }
    }

    const { inviteCode } = await request.json();

    if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
      return NextResponse.json(
        { error: 'Código de convite é obrigatório' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
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

    // Buscar turma pelo código de convite
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    const classroom = await Classroom.findOne({ 
      inviteCode: normalizedInviteCode,
      isActive: true 
    });

    if (!classroom) {
      return NextResponse.json(
        { error: 'Código de convite inválido ou turma não encontrada' },
        { status: 404 }
      );
    }

    // Validar e converter ID do aluno
    let studentObjectId: mongoose.Types.ObjectId;
    try {
      studentObjectId = new mongoose.Types.ObjectId(session.user.id);
    } catch (e: any) {
      console.error('Erro ao converter ID do aluno:', e);
      console.error('ID recebido:', session.user.id);
      return NextResponse.json(
        { error: 'ID do aluno inválido' },
        { status: 400 }
      );
    }

    // Verificar se o aluno já está na turma
    const isAlreadyEnrolled = classroom.students && classroom.students.some((studentId: any) => {
      if (!studentId) return false;
      try {
        const studentIdStr = studentId.toString();
        const sessionIdStr = session.user.id.toString();
        return studentIdStr === sessionIdStr;
      } catch (e) {
        return false;
      }
    });

    if (isAlreadyEnrolled) {
      return NextResponse.json(
        { error: 'Você já está matriculado nesta turma' },
        { status: 400 }
      );
    }

    // Adicionar aluno à turma
    try {
      const updatedClassroom = await Classroom.findByIdAndUpdate(
        classroom._id,
        { $push: { students: studentObjectId } },
        { new: true }
      );

      if (!updatedClassroom) {
        console.error('Erro: Turma não foi atualizada');
        return NextResponse.json(
          { error: 'Erro ao adicionar aluno à turma' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Você entrou na turma com sucesso!',
        classroom: {
          _id: updatedClassroom._id.toString(),
          name: updatedClassroom.name,
          description: updatedClassroom.description,
        },
      });
    } catch (updateError: any) {
      console.error('Erro ao atualizar turma:', updateError);
      console.error('Stack trace:', updateError?.stack);
      return NextResponse.json(
        { error: 'Erro ao adicionar aluno à turma' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao entrar na turma:', error);
    console.error('Stack trace:', error?.stack);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      stack: error?.stack,
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
