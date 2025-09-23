#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Variáveis globais para controle de processos
let devProcess = null;
let isRunning = false;

// Função para imprimir com cores
function colorLog(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para limpar a tela
function clearScreen() {
  console.clear();
  colorLog('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  colorLog('║                    🚀 CodeArena Admin Panel                 ║', 'cyan');
  colorLog('║              Sistema de Administração e Testes              ║', 'cyan');
  colorLog('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  console.log();
}

// Função para verificar se o arquivo .env.local existe
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    colorLog('⚠️  Arquivo .env.local não encontrado!', 'yellow');
    colorLog('📝 Copiando env.example para .env.local...', 'blue');
    
    const envExamplePath = path.join(process.cwd(), 'env.example');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      colorLog('✅ Arquivo .env.local criado com sucesso!', 'green');
      colorLog('🔧 Configure as variáveis de ambiente antes de continuar.', 'yellow');
      return false;
    } else {
      colorLog('❌ Arquivo env.example não encontrado!', 'red');
      return false;
    }
  }
  return true;
}

// Função para verificar dependências
function checkDependencies() {
  return new Promise((resolve) => {
    colorLog('🔍 Verificando dependências...', 'blue');
    exec('npm list --depth=0', (error, stdout, stderr) => {
      if (error) {
        colorLog('❌ Dependências não instaladas!', 'red');
        resolve(false);
      } else {
        colorLog('✅ Dependências verificadas!', 'green');
        resolve(true);
      }
    });
  });
}

// Função para instalar dependências
function installDependencies() {
  return new Promise((resolve) => {
    colorLog('📦 Instalando dependências...', 'blue');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';
    const installProcess = spawn(command, ['install'], { 
      stdio: 'inherit',
      shell: isWindows 
    });
    
    installProcess.on('close', (code) => {
      if (code === 0) {
        colorLog('✅ Dependências instaladas com sucesso!', 'green');
        resolve(true);
      } else {
        colorLog('❌ Erro ao instalar dependências!', 'red');
        resolve(false);
      }
    });
    
    installProcess.on('error', (error) => {
      colorLog('❌ Erro ao executar npm install!', 'red');
      colorLog('💡 Tente executar manualmente: npm install', 'yellow');
      resolve(false);
    });
  });
}

// Função para iniciar o servidor de desenvolvimento
function startDevServer() {
  return new Promise((resolve) => {
    if (isRunning) {
      colorLog('⚠️  Servidor já está rodando!', 'yellow');
      resolve(false);
      return;
    }

    colorLog('🚀 Iniciando servidor de desenvolvimento...', 'blue');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';
    devProcess = spawn(command, ['run', 'dev'], { 
      stdio: 'inherit',
      shell: isWindows 
    });
    isRunning = true;

    // Aguardar um pouco para verificar se o servidor iniciou
    setTimeout(() => {
      if (devProcess && !devProcess.killed) {
        colorLog('✅ Servidor iniciado com sucesso!', 'green');
        colorLog('🌐 Acesse: http://localhost:3000', 'cyan');
        resolve(true);
      } else {
        colorLog('❌ Erro ao iniciar servidor!', 'red');
        resolve(false);
      }
    }, 3000);
  });
}

// Função para parar o servidor
function stopDevServer() {
  return new Promise((resolve) => {
    if (!isRunning || !devProcess) {
      colorLog('⚠️  Nenhum servidor está rodando!', 'yellow');
      resolve(false);
      return;
    }

    colorLog('🛑 Parando servidor...', 'blue');
    devProcess.kill('SIGTERM');
    isRunning = false;
    devProcess = null;
    
    setTimeout(() => {
      colorLog('✅ Servidor parado com sucesso!', 'green');
      resolve(true);
    }, 1000);
  });
}

// Função para reiniciar o servidor
async function restartDevServer() {
  colorLog('🔄 Reiniciando servidor...', 'blue');
  await stopDevServer();
  await new Promise(resolve => setTimeout(resolve, 2000));
  await startDevServer();
}

// Função para inicializar o super admin
function initSuperAdmin() {
  return new Promise((resolve) => {
    colorLog('👑 Inicializando Super Admin...', 'blue');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';
    const initProcess = spawn(command, ['run', 'init-superadmin'], { 
      stdio: 'inherit',
      shell: isWindows 
    });
    
    initProcess.on('close', (code) => {
      if (code === 0) {
        colorLog('✅ Super Admin inicializado com sucesso!', 'green');
        colorLog('🔑 Login: Configure nas variáveis de ambiente', 'cyan');
        colorLog('🔑 Senha: Configure nas variáveis de ambiente', 'cyan');
        resolve(true);
      } else {
        colorLog('❌ Erro ao inicializar Super Admin!', 'red');
        resolve(false);
      }
    });
    
    initProcess.on('error', (error) => {
      colorLog('❌ Erro ao executar init-superadmin!', 'red');
      colorLog('💡 Tente executar manualmente: npm run init-superadmin', 'yellow');
      resolve(false);
    });
  });
}

// Função para executar testes
function runTests() {
  return new Promise((resolve) => {
    colorLog('🧪 Executando testes...', 'blue');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';
    const testProcess = spawn(command, ['test'], { 
      stdio: 'inherit',
      shell: isWindows 
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        colorLog('✅ Todos os testes passaram!', 'green');
        resolve(true);
      } else {
        colorLog('❌ Alguns testes falharam!', 'red');
        resolve(false);
      }
    });
    
    testProcess.on('error', (error) => {
      colorLog('❌ Erro ao executar testes!', 'red');
      colorLog('💡 Tente executar manualmente: npm test', 'yellow');
      resolve(false);
    });
  });
}

// Função para executar linting
function runLint() {
  return new Promise((resolve) => {
    colorLog('🔍 Executando verificação de código...', 'blue');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';
    const lintProcess = spawn(command, ['run', 'lint'], { 
      stdio: 'inherit',
      shell: isWindows 
    });
    
    lintProcess.on('close', (code) => {
      if (code === 0) {
        colorLog('✅ Código verificado com sucesso!', 'green');
        resolve(true);
      } else {
        colorLog('⚠️  Problemas encontrados no código!', 'yellow');
        resolve(false);
      }
    });
    
    lintProcess.on('error', (error) => {
      colorLog('❌ Erro ao executar lint!', 'red');
      colorLog('💡 Tente executar manualmente: npm run lint', 'yellow');
      resolve(false);
    });
  });
}

// Função para fazer build da aplicação
function buildApp() {
  return new Promise((resolve) => {
    colorLog('🏗️  Fazendo build da aplicação...', 'blue');
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npm.cmd' : 'npm';
    const buildProcess = spawn(command, ['run', 'build'], { 
      stdio: 'inherit',
      shell: isWindows 
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        colorLog('✅ Build concluído com sucesso!', 'green');
        resolve(true);
      } else {
        colorLog('❌ Erro no build!', 'red');
        resolve(false);
      }
    });
    
    buildProcess.on('error', (error) => {
      colorLog('❌ Erro ao executar build!', 'red');
      colorLog('💡 Tente executar manualmente: npm run build', 'yellow');
      resolve(false);
    });
  });
}

// Função para verificar status dos serviços
function checkServicesStatus() {
  colorLog('📊 Status dos Serviços:', 'blue');
  console.log();
  
  // Verificar se o servidor está rodando
  if (isRunning) {
    colorLog('🟢 Servidor de Desenvolvimento: RODANDO', 'green');
  } else {
    colorLog('🔴 Servidor de Desenvolvimento: PARADO', 'red');
  }
  
  // Verificar arquivo .env.local
  if (checkEnvFile()) {
    colorLog('🟢 Arquivo .env.local: OK', 'green');
  } else {
    colorLog('🔴 Arquivo .env.local: AUSENTE', 'red');
  }
  
  // Verificar node_modules
  if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    colorLog('🟢 Dependências: INSTALADAS', 'green');
  } else {
    colorLog('🔴 Dependências: NÃO INSTALADAS', 'red');
  }
  
  console.log();
}

// Função para mostrar logs do servidor
function showServerLogs() {
  if (!isRunning) {
    colorLog('⚠️  Servidor não está rodando!', 'yellow');
    return;
  }
  
  colorLog('📋 Logs do servidor (Ctrl+C para voltar):', 'blue');
  console.log('─'.repeat(50));
}

// Função para abrir o navegador
function openBrowser() {
  const { exec } = require('child_process');
  const url = 'http://localhost:3000';
  
  colorLog('🌐 Abrindo navegador...', 'blue');
  
  const start = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${start} ${url}`, (error) => {
    if (error) {
      colorLog('❌ Erro ao abrir navegador!', 'red');
      colorLog(`🌐 Acesse manualmente: ${url}`, 'cyan');
    } else {
      colorLog('✅ Navegador aberto!', 'green');
    }
  });
}

// Função para limpar cache
function clearCache() {
  return new Promise((resolve) => {
    colorLog('🧹 Limpando cache...', 'blue');
    
    const isWindows = process.platform === 'win32';
    const commands = isWindows ? [
      'rmdir /s /q .next 2>nul',
      'rmdir /s /q node_modules\\.cache 2>nul',
      'npm cache clean --force'
    ] : [
      'rm -rf .next',
      'rm -rf node_modules/.cache',
      'npm cache clean --force'
    ];
    
    let completed = 0;
    const total = commands.length;
    
    commands.forEach(cmd => {
      exec(cmd, (error) => {
        completed++;
        if (completed === total) {
          colorLog('✅ Cache limpo com sucesso!', 'green');
          resolve(true);
        }
      });
    });
  });
}

// Função para setup completo
async function fullSetup() {
  colorLog('🚀 Iniciando setup completo do CodeArena...', 'magenta');
  console.log();
  
  // 1. Verificar/criar .env.local
  if (!checkEnvFile()) {
    colorLog('⚠️  Configure as variáveis de ambiente no arquivo .env.local', 'yellow');
    colorLog('📝 Pressione Enter após configurar...', 'blue');
    await new Promise(resolve => rl.question('', resolve));
  }
  
  // 2. Instalar dependências
  const depsOk = await checkDependencies();
  if (!depsOk) {
    await installDependencies();
  }
  
  // 3. Executar linting
  await runLint();
  
  // 4. Fazer build
  await buildApp();
  
  // 5. Inicializar super admin
  await initSuperAdmin();
  
  // 6. Iniciar servidor
  await startDevServer();
  
  colorLog('🎉 Setup completo finalizado!', 'green');
  colorLog('🌐 Acesse: http://localhost:3000', 'cyan');
  console.log();
}

// Função para mostrar menu principal
function showMenu() {
  clearScreen();
  
  colorLog('📋 Menu Principal:', 'bright');
  console.log();
  colorLog('1️⃣  🚀 Iniciar Servidor de Desenvolvimento', 'white');
  colorLog('2️⃣  🛑 Parar Servidor', 'white');
  colorLog('3️⃣  🔄 Reiniciar Servidor', 'white');
  colorLog('4️⃣  👑 Inicializar Super Admin', 'white');
  colorLog('5️⃣  🧪 Executar Testes', 'white');
  colorLog('6️⃣  🔍 Verificar Código (Lint)', 'white');
  colorLog('7️⃣  🏗️  Fazer Build', 'white');
  colorLog('8️⃣  📊 Verificar Status', 'white');
  colorLog('9️⃣  🌐 Abrir Navegador', 'white');
  colorLog('🔟  🧹 Limpar Cache', 'white');
  colorLog('1️⃣1️⃣  🚀 Setup Completo (Tudo)', 'white');
  colorLog('1️⃣2️⃣  📋 Ver Logs do Servidor', 'white');
  colorLog('0️⃣  ❌ Sair', 'white');
  console.log();
}

// Função para processar escolha do usuário
async function processChoice(choice) {
  switch (choice.trim()) {
    case '1':
      await startDevServer();
      break;
    case '2':
      await stopDevServer();
      break;
    case '3':
      await restartDevServer();
      break;
    case '4':
      await initSuperAdmin();
      break;
    case '5':
      await runTests();
      break;
    case '6':
      await runLint();
      break;
    case '7':
      await buildApp();
      break;
    case '8':
      checkServicesStatus();
      break;
    case '9':
      openBrowser();
      break;
    case '10':
      await clearCache();
      break;
    case '11':
      await fullSetup();
      break;
    case '12':
      showServerLogs();
      break;
    case '0':
      colorLog('👋 Encerrando CodeArena Admin Panel...', 'yellow');
      if (isRunning) {
        await stopDevServer();
      }
      process.exit(0);
      break;
    default:
      colorLog('❌ Opção inválida! Tente novamente.', 'red');
  }
  
  if (choice !== '0') {
    console.log();
    colorLog('⏳ Pressione Enter para continuar...', 'blue');
    await new Promise(resolve => rl.question('', resolve));
  }
}

// Função principal
async function main() {
  // Verificar se estamos no diretório correto
  if (!fs.existsSync('package.json')) {
    colorLog('❌ Execute este script no diretório raiz do projeto CodeArena!', 'red');
    process.exit(1);
  }
  
  // Loop principal
  while (true) {
    showMenu();
    
    const choice = await new Promise(resolve => {
      rl.question('🎯 Escolha uma opção: ', resolve);
    });
    
    await processChoice(choice);
  }
}

// Tratamento de sinais para limpeza
process.on('SIGINT', async () => {
  colorLog('\n🛑 Interrompendo...', 'yellow');
  if (isRunning) {
    await stopDevServer();
  }
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (isRunning) {
    await stopDevServer();
  }
  rl.close();
  process.exit(0);
});

// Iniciar o programa
main().catch(error => {
  colorLog(`❌ Erro fatal: ${error.message}`, 'red');
  process.exit(1);
});
