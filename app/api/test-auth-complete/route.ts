import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🧪 TESTE COMPLETO DE AUTENTICAÇÃO:', { email });
    
    // 1. Conectar ao banco
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao banco');
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // 2. Buscar usuário
    const user = await usersCollection.findOne({ 
      email: email,
      isActive: true 
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      await mongoose.disconnect();
      return NextResponse.json({
        success: false,
        step: 'user_not_found',
        message: 'Usuário não encontrado no banco de dados'
      }, { status: 401 });
    }
    
    console.log('✅ Usuário encontrado:', {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    
    // 3. Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Senha incorreta para:', email);
      await mongoose.disconnect();
      return NextResponse.json({
        success: false,
        step: 'invalid_password',
        message: 'Senha incorreta'
      }, { status: 401 });
    }
    
    console.log('✅ Senha válida');
    
    // 4. Verificar role específico
    if (user.role === 'professor') {
      const invitesCollection = db.collection('invites');
      const invite = await invitesCollection.findOne({
        email: email,
        isUsed: true
      });
      
      if (!invite) {
        console.log('❌ Professor sem convite válido:', email);
        await mongoose.disconnect();
        return NextResponse.json({
          success: false,
          step: 'no_valid_invite',
          message: 'Professor sem convite válido'
        }, { status: 401 });
      }
      
      console.log('✅ Convite válido encontrado');
    }
    
    // 5. Retornar sucesso
    const result = {
      success: true,
      message: 'Autenticação bem-sucedida',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image
      }
    };
    
    console.log('✅ AUTENTICAÇÃO COMPLETA COM SUCESSO:', result);
    
    await mongoose.disconnect();
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ ERRO NO TESTE DE AUTENTICAÇÃO:', error);
    
    return NextResponse.json({
      success: false,
      step: 'server_error',
      message: 'Erro interno no servidor',
      error: error.message
    }, { status: 500 });
  }
}
