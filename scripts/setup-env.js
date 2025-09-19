const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'development';

console.log(`🔧 Configurando ambiente: ${environment}`);

const envFiles = {
  development: 'env.example',
  production: 'env.production.example'
};

const targetFile = '.env.local';

if (!envFiles[environment]) {
  console.error('❌ Ambiente inválido. Use: development ou production');
  process.exit(1);
}

const sourceFile = envFiles[environment];

if (!fs.existsSync(sourceFile)) {
  console.error(`❌ Arquivo ${sourceFile} não encontrado!`);
  process.exit(1);
}

// Copiar arquivo de exemplo
fs.copyFileSync(sourceFile, targetFile);

console.log(`✅ Arquivo ${targetFile} criado a partir de ${sourceFile}`);

if (environment === 'production') {
  console.log('⚠️  Lembre-se de configurar as variáveis de produção:');
  console.log('   - GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET');
  console.log('   - MONGODB_URI (string de conexão real)');
  console.log('   - JUDGE0_API_KEY (chave real da API)');
  console.log('   - NEXTAUTH_SECRET (chave secreta forte)');
  console.log('   - NEXTAUTH_URL (URL de produção)');
}

console.log(`🚀 Ambiente ${environment} configurado com sucesso!`);
