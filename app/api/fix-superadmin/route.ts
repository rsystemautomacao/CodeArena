import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    console.log('🔧 CORRIGINDO SUPERADMIN...');
    
    // Conectar ao banco
    await connectDB();
    console.log('✅ CONECTADO AO MONGODB');

    const superadminEmail = 'admin@rsystem.com';
    const superadminPassword = '@Desbravadores@93';

    // Buscar superadmin existente
    const existingSuperadmin = await User.findOne({ email: superadminEmail });
    
    if (existingSuperadmin) {
      console.log('👤 SUPERADMIN EXISTENTE ENCONTRADO:', {
        id: existingSuperadmin._id,
        email: existingSuperadmin.email,
        hasPassword: !!existingSuperadmin.password,
        passwordLength: existingSuperadmin.password?.length || 0,
        isActive: existingSuperadmin.isActive
      });

      // Recriar senha
      const hashedPassword = await bcrypt.hash(superadminPassword, 12);
      
      // Atualizar superadmin
      await User.findByIdAndUpdate(existingSuperadmin._id, {
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
        name: 'Super Admin',
        updatedAt: new Date()
      });

      console.log('✅ SUPERADMIN ATUALIZADO COM NOVA SENHA');

      // Verificar se funcionou
      const updatedSuperadmin = await User.findById(existingSuperadmin._id);
      const passwordMatch = await bcrypt.compare(superadminPassword, updatedSuperadmin.password);

      return NextResponse.json({
        success: true,
        message: 'Superadmin corrigido com sucesso',
        details: {
          id: updatedSuperadmin._id,
          email: updatedSuperadmin.email,
          role: updatedSuperadmin.role,
          isActive: updatedSuperadmin.isActive,
          hasPassword: !!updatedSuperadmin.password,
          passwordLength: updatedSuperadmin.password?.length || 0,
          passwordMatch,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.log('❌ SUPERADMIN NÃO ENCONTRADO, CRIANDO NOVO...');
      
      // Criar novo superadmin
      const hashedPassword = await bcrypt.hash(superadminPassword, 12);
      
      const newSuperadmin = await User.create({
        name: 'Super Admin',
        email: superadminEmail,
        password: hashedPassword,
        role: 'superadmin',
        isActive: true
      });

      console.log('✅ NOVO SUPERADMIN CRIADO:', {
        id: newSuperadmin._id,
        email: newSuperadmin.email,
        role: newSuperadmin.role
      });

      return NextResponse.json({
        success: true,
        message: 'Novo superadmin criado com sucesso',
        details: {
          id: newSuperadmin._id,
          email: newSuperadmin.email,
          role: newSuperadmin.role,
          isActive: newSuperadmin.isActive,
          hasPassword: !!newSuperadmin.password,
          passwordLength: newSuperadmin.password?.length || 0,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error: any) {
    console.error('❌ ERRO AO CORRIGIR SUPERADMIN:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao corrigir superadmin',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
