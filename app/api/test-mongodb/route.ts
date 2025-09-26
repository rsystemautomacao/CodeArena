import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    console.log('🔍 TESTANDO CONEXÃO COM MONGODB...');
    
    await connectDB();
    
    // Testar se consegue listar usuários
    const userCount = await User.countDocuments();
    
    // Testar se consegue criar um usuário de teste
    const testUser = {
      name: 'Teste',
      email: 'teste@teste.com',
      password: 'teste123',
      role: 'aluno',
      isActive: true
    };
    
    // Verificar se já existe
    const existingTest = await User.findOne({ email: 'teste@teste.com' });
    if (existingTest) {
      await User.deleteOne({ email: 'teste@teste.com' });
    }
    
    const createdUser = await User.create(testUser);
    const createdUserId = createdUser._id;
    
    // Deletar o usuário de teste
    await User.deleteOne({ _id: createdUserId });
    
    const result = {
      success: true,
      message: 'Conexão com MongoDB funcionando',
      details: {
        connectionStatus: 'CONECTADO',
        userCount,
        testUserCreated: true,
        testUserDeleted: true,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('✅ MONGODB TEST SUCCESS:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE MONGODB:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro de conexão com MongoDB',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: {
        connectionStatus: 'ERRO',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
