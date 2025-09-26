import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    console.log('🔧 INICIANDO SETUP DO BANCO DE DADOS...');
    
    // Executar o script de setup
    const { stdout, stderr } = await execAsync('node scripts/setup-mongodb.js', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        MONGODB_URI: process.env.MONGODB_URI
      }
    });

    console.log('📋 OUTPUT DO SCRIPT:');
    console.log(stdout);
    
    if (stderr) {
      console.error('⚠️ ERROS DO SCRIPT:');
      console.error(stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Setup do banco de dados concluído',
      output: stdout,
      errors: stderr || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERRO NO SETUP DO BANCO:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro no setup do banco de dados',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
