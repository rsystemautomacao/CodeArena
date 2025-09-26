import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    console.log('🔍 VERIFICANDO SUPERADMIN NO BANCO...');
    
    await connectDB();
    
    // Buscar superadmin
    const superadmin = await User.findOne({ role: 'superadmin' });
    
    if (!superadmin) {
      return NextResponse.json({
        success: false,
        message: 'Superadmin não encontrado no banco de dados',
        details: {
          totalUsers: await User.countDocuments(),
          allUsers: await User.find({}, { email: 1, role: 1, isActive: 1 })
        }
      }, { status: 404 });
    }

    // Verificar detalhes do superadmin
    const result = {
      success: true,
      message: 'Superadmin encontrado',
      superadmin: {
        id: superadmin._id,
        name: superadmin.name,
        email: superadmin.email,
        role: superadmin.role,
        isActive: superadmin.isActive,
        hasPassword: !!superadmin.password,
        passwordLength: superadmin.password?.length || 0,
        createdAt: superadmin.createdAt
      },
      database: {
        totalUsers: await User.countDocuments(),
        usersByRole: {
          superadmin: await User.countDocuments({ role: 'superadmin' }),
          professor: await User.countDocuments({ role: 'professor' }),
          aluno: await User.countDocuments({ role: 'aluno' })
        }
      }
    };

    console.log('✅ SUPERADMIN ENCONTRADO:', result);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ ERRO AO VERIFICAR SUPERADMIN:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao verificar superadmin',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
