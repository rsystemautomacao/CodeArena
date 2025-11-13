import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Assignment from '@/models/Assignment';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'professor') {
      return NextResponse.json(
        { error: 'Apenas professores podem excluir atividades' },
        { status: 403 }
      );
    }

    await connectDB();

    const assignment = await Assignment.findById(params.id);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se o professor é o criador da atividade
    if (assignment.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Você só pode excluir suas próprias atividades' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como inativo
    await Assignment.findByIdAndUpdate(params.id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Atividade excluída com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao excluir atividade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', debug: error?.message },
      { status: 500 }
    );
  }
}

