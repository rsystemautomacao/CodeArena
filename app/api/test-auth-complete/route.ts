import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TESTE COMPLETO DO SISTEMA DE AUTENTICAÇÃO...');
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: [] as any[]
    };
    
    // Teste 1: Verificar variáveis de ambiente
    console.log('🧪 TESTE 1: Variáveis de ambiente');
    const envTest = {
      name: 'Variáveis de ambiente',
      success: true,
      details: {
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'FALTANDO',
        MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADO' : 'FALTANDO',
        SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL || 'FALTANDO',
        SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO'
      }
    };
    results.tests.push(envTest);
    
    // Teste 2: Conectar ao banco de dados
    console.log('🧪 TESTE 2: Conexão com banco de dados');
    let dbTest = { name: 'Conexão com banco', success: false, details: {} };
    
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
      
      await mongoose.connect(MONGODB_URI);
      console.log('✅ CONEXÃO COM BANCO ESTABELECIDA');
      
      const db = mongoose.connection.db;
      if (db) {
        dbTest.success = true;
        dbTest.details = {
          connected: true,
          databaseName: db.databaseName
        };
      } else {
        dbTest.details = { connected: false, error: 'Não foi possível obter referência do banco' };
      }
    } catch (error) {
      dbTest.details = { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
    results.tests.push(dbTest);
    
    // Teste 3: Verificar superadmin no banco
    console.log('🧪 TESTE 3: Superadmin no banco');
    let superadminTest = { name: 'Superadmin no banco', success: false, details: {} };
    
    try {
      const db = mongoose.connection.db;
      if (db) {
        const usersCollection = db.collection('users');
        
        // Buscar superadmin
        const superadmin = await usersCollection.findOne({ 
          email: 'admin@rsystem.com',
          role: 'superadmin'
        });
        
        if (superadmin) {
          superadminTest.success = true;
          superadminTest.details = {
            found: true,
            id: superadmin._id.toString(),
            email: superadmin.email,
            name: superadmin.name,
            role: superadmin.role,
            isActive: superadmin.isActive,
            hasPassword: !!superadmin.password,
            passwordLength: superadmin.password ? superadmin.password.length : 0
          };
        } else {
          superadminTest.details = { found: false, message: 'Superadmin não encontrado' };
        }
      } else {
        superadminTest.details = { found: false, error: 'Banco não conectado' };
      }
    } catch (error) {
      superadminTest.details = { 
        found: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
    results.tests.push(superadminTest);
    
    // Teste 4: Verificar hash da senha
    console.log('🧪 TESTE 4: Hash da senha');
    let passwordTest = { name: 'Hash da senha', success: false, details: {} };
    
    try {
      const db = mongoose.connection.db;
      if (db) {
        const usersCollection = db.collection('users');
        const superadmin = await usersCollection.findOne({ 
          email: 'admin@rsystem.com',
          role: 'superadmin'
        });
        
        if (superadmin && superadmin.password) {
          const testPassword = '@Desbravadores@93';
          const isPasswordValid = await bcrypt.compare(testPassword, superadmin.password);
          
          passwordTest.success = isPasswordValid;
          passwordTest.details = {
            hasPassword: true,
            passwordValid: isPasswordValid,
            passwordLength: superadmin.password.length
          };
        } else {
          passwordTest.details = { 
            hasPassword: false, 
            message: 'Superadmin não tem senha ou não existe' 
          };
        }
      } else {
        passwordTest.details = { hasPassword: false, error: 'Banco não conectado' };
      }
    } catch (error) {
      passwordTest.details = { 
        hasPassword: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
    results.tests.push(passwordTest);
    
    // Teste 5: Contar usuários totais
    console.log('🧪 TESTE 5: Contagem de usuários');
    let usersTest = { name: 'Contagem de usuários', success: false, details: {} };
    
    try {
      const db = mongoose.connection.db;
      if (db) {
        const usersCollection = db.collection('users');
        const totalUsers = await usersCollection.countDocuments();
        const superadminUsers = await usersCollection.countDocuments({ role: 'superadmin' });
        const professorUsers = await usersCollection.countDocuments({ role: 'professor' });
        const alunoUsers = await usersCollection.countDocuments({ role: 'aluno' });
        
        usersTest.success = true;
        usersTest.details = {
          total: totalUsers,
          superadmin: superadminUsers,
          professor: professorUsers,
          aluno: alunoUsers
        };
      } else {
        usersTest.details = { error: 'Banco não conectado' };
      }
    } catch (error) {
      usersTest.details = { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
    results.tests.push(usersTest);
    
    // Desconectar do banco
    try {
      await mongoose.disconnect();
      console.log('✅ DESCONECTADO DO BANCO');
    } catch (error) {
      console.log('⚠️ ERRO AO DESCONECTAR:', error);
    }
    
    // Calcular sucesso geral
    const totalTests = results.tests.length;
    const successfulTests = results.tests.filter(test => test.success).length;
    const successRate = (successfulTests / totalTests) * 100;
    
    results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: Math.round(successRate * 100) / 100
    };
    
    console.log('📊 RESUMO DOS TESTES:', results.summary);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.log('❌ ERRO NO TESTE COMPLETO:', error);
    
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.log('⚠️ ERRO AO DESCONECTAR:', disconnectError);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}