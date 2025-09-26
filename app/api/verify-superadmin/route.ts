import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  try {
    console.log('🔍 VERIFICANDO SUPERADMIN NO BANCO...');
    
    // Conectar ao MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
    
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Buscar superadmin
    const superadmin = await usersCollection.findOne({ role: 'superadmin' });
    
    if (!superadmin) {
      const totalUsers = await usersCollection.countDocuments();
      const allUsers = await usersCollection.find({}, { projection: { email: 1, role: 1, isActive: 1 } }).toArray();
      
      await mongoose.disconnect();
      
      return NextResponse.json({
        success: false,
        message: 'Superadmin não encontrado no banco de dados',
        details: {
          totalUsers,
          allUsers
        }
      }, { status: 404 });
    }

    // Verificar detalhes do superadmin
    const totalUsers = await usersCollection.countDocuments();
    const usersByRole = {
      superadmin: await usersCollection.countDocuments({ role: 'superadmin' }),
      professor: await usersCollection.countDocuments({ role: 'professor' }),
      aluno: await usersCollection.countDocuments({ role: 'aluno' })
    };

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
        totalUsers,
        usersByRole
      }
    };

    console.log('✅ SUPERADMIN ENCONTRADO:', result);
    
    await mongoose.disconnect();
    
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
