import { NextRequest, NextResponse } from 'next/server';
import { validateInvite } from '@/lib/invite';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    console.log('🎯 [API] Validando convite com token:', params.token);
    const result = await validateInvite(params.token);
    console.log('🎯 [API] Resultado da validação:', result);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('🎯 [API] Erro na validação:', error);
    return NextResponse.json(
      { valid: false, error: error.message },
      { status: 400 }
    );
  }
}
