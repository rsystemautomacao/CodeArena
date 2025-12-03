import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateLabIP, getClientIP } from '@/lib/ip-validation';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import Assignment from '@/models/Assignment';

/**
 * GET - Verificar status de acesso do aluno a uma prova
 */
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

    await connectDB();

    const assignment = await Assignment.findById(params.id)
      .populate('classroom', 'name students');

    if (!assignment) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se é uma prova
    if (assignment.type !== 'prova') {
      return NextResponse.json({
        hasAccess: true,
        isProva: false,
        message: 'Esta é uma lista, não uma prova',
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const clientIP = getClientIP(request);
    
    // Verificar habilitação manual
    let isEnabled = true;
    let enabledMessage = '';
    
    if (assignment.enabledStudents && assignment.enabledStudents.length > 0) {
      isEnabled = assignment.enabledStudents.some(
        (enabledId: mongoose.Types.ObjectId) => enabledId.toString() === userObjectId.toString()
      );
      
      if (!isEnabled) {
        enabledMessage = 'Você não está habilitado para realizar esta prova. Entre em contato com o professor.';
      }
    }

    // Verificar IP do laboratório
    let ipValid = true;
    let ipMessage = '';
    
    if (assignment.requireLabIP && assignment.allowedIPRanges && assignment.allowedIPRanges.length > 0) {
      const ipValidation = validateLabIP(request, assignment.allowedIPRanges);
      ipValid = ipValidation.isValid;
      
      if (!ipValid) {
        ipMessage = `Seu IP (${ipValidation.clientIP}) não está na rede do laboratório permitida. Esta prova só pode ser realizada na rede do laboratório de informática.`;
      } else {
        ipMessage = `IP verificado: ${ipValidation.clientIP} está na rede do laboratório.`;
      }
    }

    const hasAccess = isEnabled && ipValid;

    return NextResponse.json({
      hasAccess,
      isProva: true,
      isEnabled,
      ipValid,
      clientIP,
      enabledMessage: enabledMessage || undefined,
      ipMessage: ipMessage || undefined,
      requireLabIP: assignment.requireLabIP || false,
      allowedIPRanges: assignment.allowedIPRanges || [],
    });
  } catch (error: any) {
    console.error('Erro ao verificar acesso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

