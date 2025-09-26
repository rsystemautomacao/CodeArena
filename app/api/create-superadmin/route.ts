import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 CRIANDO SUPERADMIN NO BANCO...');
    
    await connectDB();
    
    const superadminEmail = 'admin@rsystem.com';
    const superadminPassword = '@Desbravadores@93';
    
    // Verificar se já existe
    const existingSuperadmin = await User.findOne({ email: superadminEmail });
    
    if (existingSuperadmin) {
      console.log('⚠️ SUPERADMIN JÁ EXISTE, ATUALIZANDO...');
      
      // Atualizar senha e role
      const hashedPassword = await bcrypt.hash(superadminPassword, 12);
      
      await User.findByIdAndUpdate(existingSuperadmin._id, {
        role: 'superadmin',
        password: hashedPassword,
        isActive: true,
        name: 'Super Admin',
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Superadmin atualizado com sucesso',
        email: superadminEmail,
        role: 'superadmin'
      });
    }
    
    // Criar novo superadmin
    console.log('✅ CRIANDO NOVO SUPERADMIN...');
    
    const hashedPassword = await bcrypt.hash(superadminPassword, 12);
    
    const superadmin = await User.create({
      name: 'Super Admin',
      email: superadminEmail,
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('🎉 SUPERADMIN CRIADO COM SUCESSO:', {
      id: superadmin._id,
      email: superadmin.email,
      role: superadmin.role
    });
    
    return NextResponse.json({
      success: true,
      message: 'Superadmin criado com sucesso',
      user: {
        id: superadmin._id,
        email: superadmin.email,
        role: superadmin.role,
        name: superadmin.name
      }
    });
    
  } catch (error) {
    console.error('❌ ERRO AO CRIAR SUPERADMIN:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar superadmin',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
