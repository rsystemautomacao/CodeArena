import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Importar modelos para garantir que estejam registrados
import '@/models/User';
import '@/models/Exercise';
import '@/models/Submission';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const dbConnection = await connectDB();
    if (!dbConnection) {
      console.error('Erro: Não foi possível conectar ao banco de dados');
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados' },
        { status: 500 }
      );
    }

    // Garantir que os modelos estão registrados
    const Submission = (await import('@/models/Submission')).default;

    if (!Submission) {
      console.error('Erro: Modelo Submission não encontrado');
      return NextResponse.json(
        { error: 'Erro ao carregar modelo do banco de dados' },
        { status: 500 }
      );
    }

    let userObjectId: mongoose.Types.ObjectId;
    let submissionObjectId: mongoose.Types.ObjectId;
    
    try {
      userObjectId = new mongoose.Types.ObjectId(session.user.id);
      submissionObjectId = new mongoose.Types.ObjectId(id);
    } catch (e: any) {
      console.error('Erro ao converter IDs:', e);
      return NextResponse.json(
        { error: 'ID inválido fornecido' },
        { status: 400 }
      );
    }

    try {
      // Buscar submissão específica do usuário
      const submission = await Submission.findById(submissionObjectId)
        .populate('exercise', 'title')
        .populate('assignment', 'title')
        .populate('user', 'name email');

      if (!submission) {
        return NextResponse.json(
          { error: 'Submissão não encontrada' },
          { status: 404 }
        );
      }

      // Verificar se a submissão pertence ao usuário logado
      // submission.user pode ser um ObjectId ou um objeto populado
      let submissionUserId: string;
      
      if (!submission.user) {
        console.error('❌ Submissão sem campo user:', submission);
        return NextResponse.json(
          { error: 'Submissão inválida - campo user não encontrado' },
          { status: 500 }
        );
      }
      
      if (typeof submission.user === 'object' && submission.user !== null && '_id' in submission.user) {
        // Objeto populado
        submissionUserId = submission.user._id.toString();
      } else if (typeof submission.user === 'string') {
        // ObjectId como string
        submissionUserId = submission.user;
      } else {
        // ObjectId do mongoose
        submissionUserId = submission.user.toString();
      }
      
      const userObjectIdString = userObjectId.toString();
      
      console.log('🔍 VERIFICANDO ACESSO:', {
        submissionUserId,
        userObjectIdString,
        sessionUserId: session.user.id,
        match: submissionUserId === userObjectIdString
      });
      
      if (submissionUserId !== userObjectIdString) {
        console.error('❌ ACESSO NEGADO - IDs diferentes:', {
          submissionUserId,
          userObjectIdString,
          sessionUserId: session.user.id,
          submissionId: submission._id.toString()
        });
        return NextResponse.json(
          { error: 'Acesso negado - esta submissão não pertence a você' },
          { status: 403 }
        );
      }

      // Verificar se exercise foi populado corretamente
      const exerciseData = typeof submission.exercise === 'object' && submission.exercise !== null
        ? {
            _id: submission.exercise._id.toString(),
            title: submission.exercise.title || 'Exercício não encontrado',
          }
        : {
            _id: submission.exercise.toString(),
            title: 'Exercício não encontrado',
          };

      // Verificar se assignment foi populado corretamente
      const assignmentData = submission.assignment && typeof submission.assignment === 'object' && submission.assignment !== null
        ? {
            _id: submission.assignment._id.toString(),
            title: submission.assignment.title || 'Atividade não encontrada',
          }
        : submission.assignment
        ? {
            _id: submission.assignment.toString(),
            title: 'Atividade não encontrada',
          }
        : undefined;

      return NextResponse.json({
        submission: {
          _id: submission._id.toString(),
          exercise: exerciseData,
          assignment: assignmentData,
          code: submission.code,
          language: submission.language,
          status: submission.status,
          result: submission.result,
          submittedAt: submission.submittedAt,
        },
      });
    } catch (e: any) {
      console.error('Erro ao buscar submissão do banco:', e);
      return NextResponse.json(
        { error: 'Erro ao buscar submissão' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao buscar submissão:', error);
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

