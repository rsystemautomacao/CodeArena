import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Assignment from '@/models/Assignment';

/**
 * GET - Obter configurações de controle de acesso de uma atividade
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Apenas professores podem acessar essas configurações' },
        { status: 403 }
      );
    }

    await connectDB();

    const assignment = await Assignment.findById(params.id)
      .populate('enabledStudents', 'name email')
      .populate('classroom', 'name students');

    if (!assignment) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o professor é o criador
    if (assignment.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar esta atividade' },
        { status: 403 }
      );
    }

    // Buscar todos os alunos da turma
    const Classroom = (await import('@/models/Classroom')).default;
    const classroom = await Classroom.findById(assignment.classroom)
      .populate('students', 'name email');

    return NextResponse.json({
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        type: assignment.type,
        enabledStudents: assignment.enabledStudents || [],
        requireLabIP: assignment.requireLabIP || false,
        allowedIPRanges: assignment.allowedIPRanges || [],
      },
      classroomStudents: classroom?.students || [],
    });
  } catch (error: any) {
    console.error('Erro ao buscar controle de acesso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualizar configurações de controle de acesso
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Apenas professores podem atualizar essas configurações' },
        { status: 403 }
      );
    }

    const {
      enabledStudents,
      requireLabIP,
      allowedIPRanges,
    } = await request.json();

    await connectDB();

    const assignment = await Assignment.findById(params.id);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o professor é o criador
    if (assignment.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para atualizar esta atividade' },
        { status: 403 }
      );
    }

    // Atualizar apenas campos fornecidos
    const updateData: any = {};
    
    if (enabledStudents !== undefined) {
      // Validar que são ObjectIds válidos
      try {
        updateData.enabledStudents = enabledStudents.map((id: string) => 
          new mongoose.Types.ObjectId(id)
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'IDs de alunos inválidos' },
          { status: 400 }
        );
      }
    }

    if (requireLabIP !== undefined) {
      updateData.requireLabIP = Boolean(requireLabIP);
    }

    if (allowedIPRanges !== undefined) {
      // Validar formato das faixas de IP
      const validRanges = allowedIPRanges.filter((range: string) => {
        // Aceitar IPs simples ou faixas CIDR
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
        return ipRegex.test(range.trim());
      });
      
      updateData.allowedIPRanges = validRanges;
    }

    await Assignment.findByIdAndUpdate(params.id, updateData);

    const updated = await Assignment.findById(params.id)
      .populate('enabledStudents', 'name email');

    return NextResponse.json({
      success: true,
      assignment: {
        _id: updated._id,
        enabledStudents: updated.enabledStudents || [],
        requireLabIP: updated.requireLabIP || false,
        allowedIPRanges: updated.allowedIPRanges || [],
      },
    });
  } catch (error: any) {
    console.error('Erro ao atualizar controle de acesso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

