# 🔧 Guia de Configuração - CodeArena

Este guia explica como configurar o CodeArena para diferentes ambientes.

## 🚀 Configuração Rápida

### Desenvolvimento (Homologação)
```bash
npm run setup:dev
npm run dev
```

### Produção
```bash
npm run setup:prod
# Configure as variáveis de produção no .env.local
npm run build
npm start
```

## 📁 Estrutura de Arquivos de Ambiente

```
├── env.example              # Desenvolvimento (dados mockados)
├── env.production.example   # Produção (dados reais)
├── .env.local              # Arquivo atual (não commitado)
└── .gitignore              # Ignora .env.local e .env.production
```

## 🔧 Configuração por Ambiente

### 🧪 Desenvolvimento (Homologação)

**Arquivo**: `env.example` → `.env.local`

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=codearena-super-secret-key-for-development-2024

# Google OAuth (dados mockados)
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz

# MongoDB (dados mockados)
MONGODB_URI=mongodb://localhost:27017/codearena-dev

# Judge0 API (dados mockados)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=judge0-mock-key-for-development

# Superadmin
SUPERADMIN_EMAIL=admin@rsystem.com
SUPERADMIN_PASSWORD=@Desbravadores@93

# Ambiente
NODE_ENV=development
```

**Características**:
- ✅ Funciona sem banco de dados real
- ✅ Login com qualquer email/senha
- ✅ Super Admin: `admin@rsystem.com` / `@Desbravadores@93`
- ✅ Dados mockados para APIs externas

### 🚀 Produção

**Arquivo**: `env.production.example` → `.env.local`

```env
# NextAuth.js
NEXTAUTH_URL=https://seu-dominio.com
NEXTAUTH_SECRET=super-secret-key-for-production-change-this

# Google OAuth (dados reais)
GOOGLE_CLIENT_ID=your-real-google-client-id
GOOGLE_CLIENT_SECRET=your-real-google-client-secret

# MongoDB (dados reais)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codearena

# Judge0 API (dados reais)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-real-judge0-api-key

# Superadmin
SUPERADMIN_EMAIL=admin@rsystem.com
SUPERADMIN_PASSWORD=@Desbravadores@93

# Ambiente
NODE_ENV=production
```

**Características**:
- ✅ Usa banco de dados MongoDB Atlas real
- ✅ Google OAuth configurado
- ✅ Judge0 API real
- ✅ Dados persistentes

## 🔄 Como Trocar de Ambiente

### Para Desenvolvimento:
```bash
npm run setup:dev
npm run dev
```

### Para Produção:
```bash
npm run setup:prod
# Edite .env.local com dados reais
npm run build
npm start
```

## 🗄️ Configuração do MongoDB Atlas (Produção)

### 1. Criar Conta
1. Acesse: https://www.mongodb.com/atlas
2. Crie conta gratuita
3. Escolha "Shared" (gratuito)

### 2. Configurar Cluster
1. Nome: `CodeArena`
2. Região: Mais próxima
3. Clique "Create Cluster"

### 3. Configurar Acesso
1. **Database Access**:
   - Username: `codearena-user`
   - Password: `sua-senha-segura`
   - Privileges: "Read and write to any database"

2. **Network Access**:
   - IP: `0.0.0.0/0` (qualquer lugar)

### 4. Obter String de Conexão
1. Clique "Connect" → "Connect your application"
2. Driver: "Node.js"
3. Copie a string

### 5. Configurar no .env.local
```env
MONGODB_URI=mongodb+srv://codearena-user:sua-senha-segura@cluster0.xxxxx.mongodb.net/codearena?retryWrites=true&w=majority
```

## 🔑 Configuração do Google OAuth (Produção)

### 1. Google Cloud Console
1. Acesse: https://console.cloud.google.com/
2. Crie projeto ou selecione existente
3. Ative "Google+ API"

### 2. Criar Credenciais
1. "APIs & Services" → "Credentials"
2. "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Authorized redirect URIs:
   - `https://seu-dominio.com/api/auth/callback/google`

### 3. Configurar no .env.local
```env
GOOGLE_CLIENT_ID=seu-client-id-real
GOOGLE_CLIENT_SECRET=seu-client-secret-real
```

## ⚡ Configuração do Judge0 API (Produção)

### 1. RapidAPI
1. Acesse: https://rapidapi.com/
2. Crie conta gratuita
3. Procure "Judge0 CE"
4. Assine plano gratuito

### 2. Obter API Key
1. Vá em "My Apps"
2. Copie a API Key

### 3. Configurar no .env.local
```env
JUDGE0_API_KEY=sua-api-key-real
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte repositório ao Vercel
2. Configure variáveis de ambiente no painel
3. Deploy automático

### Render
1. Conecte repositório ao Render
2. Configure variáveis de ambiente
3. Deploy automático

## 🔒 Segurança

### Desenvolvimento
- ✅ Dados mockados seguros
- ✅ Sem exposição de credenciais reais
- ✅ Funciona offline

### Produção
- ✅ Chaves secretas fortes
- ✅ HTTPS obrigatório
- ✅ Firewall configurado
- ✅ Backup automático

## 🧪 Teste de Login

### Desenvolvimento
- **Super Admin**: `admin@rsystem.com` / `@Desbravadores@93`
- **Professor**: `professor@teste.com` / `qualquer-senha`
- **Aluno**: `aluno@teste.com` / `qualquer-senha`

### Produção
- **Super Admin**: `admin@rsystem.com` / `@Desbravadores@93`
- **Professores**: Login com Google (após convite)
- **Alunos**: Login com Google

## 🆘 Solução de Problemas

### Erro de Configuração
```bash
# Limpar cache e reinstalar
rm -rf .next node_modules
npm install
npm run setup:dev
npm run dev
```

### Erro de MongoDB
```bash
# Verificar string de conexão
echo $MONGODB_URI
```

### Erro de Google OAuth
```bash
# Verificar URLs de callback
# Deve incluir: /api/auth/callback/google
```

---

**💡 Dica**: Use `npm run admin` para gerenciar a aplicação facilmente!
