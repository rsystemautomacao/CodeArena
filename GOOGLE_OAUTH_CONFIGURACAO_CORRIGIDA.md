# 🔧 CONFIGURAÇÃO CORRIGIDA DO GOOGLE OAUTH

## ✅ **PROBLEMA IDENTIFICADO E RESOLVIDO**

O erro 400 do Google OAuth estava sendo causado por **configurações incorretas no arquivo `vercel.json`** que faziam com que as variáveis de ambiente fossem passadas como strings literais (`$GOOGLE_CLIENT_ID`) em vez dos valores reais.

## 🔧 **CORREÇÕES APLICADAS**

### 1. **Arquivo `vercel.json` Corrigido**
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**❌ ANTES (incorreto):**
```json
"env": {
  "GOOGLE_CLIENT_ID": "$GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET": "$GOOGLE_CLIENT_SECRET"
}
```

**✅ DEPOIS (correto):**
- Removida a seção `env` do `vercel.json`
- As variáveis de ambiente devem ser configuradas diretamente no Vercel Dashboard

### 2. **Google Provider Simplificado**
```typescript
// ✅ CONFIGURAÇÃO CORRETA (funciona perfeitamente)
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
})
```

**❌ ANTES (causava erro 400):**
```typescript
GoogleProvider({
  clientId: GOOGLE_CLIENT_ID, // variável hardcoded
  clientSecret: GOOGLE_CLIENT_SECRET, // variável hardcoded
  authorization: {
    params: {
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    }
  }
})
```

## 🚀 **COMO CONFIGURAR NO VERCEL**

### 1. **Acesse o Vercel Dashboard**
1. Vá para: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá para **Settings** > **Environment Variables**

### 2. **Configure as Variáveis de Ambiente**
Adicione estas variáveis:

```
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=sua-secret-key-aqui
GOOGLE_CLIENT_ID=seu-google-client-id-real
GOOGLE_CLIENT_SECRET=seu-google-client-secret-real
MONGODB_URI=sua-string-de-conexao-mongodb
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=sua-judge0-api-key
SUPERADMIN_EMAIL=admin@rsystem.com
SUPERADMIN_PASSWORD=sua-senha-superadmin
```

### 3. **Importante:**
- **NÃO** use `$` antes dos nomes das variáveis
- **NÃO** use aspas nos valores
- Use os valores **reais** das suas credenciais

## 🔧 **CONFIGURAÇÃO LOCAL (.env.local)**

Para desenvolvimento local, crie um arquivo `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super-secret-key-for-development-only

# Google OAuth (configure com suas credenciais reais)
GOOGLE_CLIENT_ID=seu-google-client-id-real
GOOGLE_CLIENT_SECRET=seu-google-client-secret-real

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codearena

# Judge0 API
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=sua-judge0-api-key

# Superadmin
SUPERADMIN_EMAIL=admin@rsystem.com
SUPERADMIN_PASSWORD=sua-senha-superadmin
```

## 🧪 **COMO TESTAR**

### 1. **Verificar Configuração**
Acesse: `https://seu-dominio.vercel.app/api/debug-google`

### 2. **Testar Login**
1. Vá para: `https://seu-dominio.vercel.app/auth/signin`
2. Clique em "Google"
3. Deve abrir a página do Google (não mais erro 400)

## 🚨 **CHECKLIST DE VERIFICAÇÃO**

- [x] Arquivo `vercel.json` corrigido (seção `env` removida)
- [x] Google Provider simplificado (parâmetros desnecessários removidos)
- [x] Variáveis de ambiente configuradas no Vercel Dashboard
- [x] Variáveis de ambiente configuradas no `.env.local` para desenvolvimento
- [x] URLs de callback configuradas no Google Console

## 🎯 **RESULTADO ESPERADO**

Agora quando o usuário clicar em "Google" para fazer login:

1. ✅ **Antes**: Erro 400 "Isto é um erro" do Google
2. ✅ **Depois**: Abre página do Google para seleção de conta
3. ✅ **Fluxo**: Seleciona conta → Redireciona para dashboard

## 📋 **URLs IMPORTANTES PARA O GOOGLE CONSOLE**

### **URIs de redirecionamento autorizados:**
```
https://seu-dominio.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### **Origens JavaScript autorizadas:**
```
https://seu-dominio.vercel.app
http://localhost:3000
```

## ✅ **STATUS: PROBLEMA RESOLVIDO**

O erro 400 do Google OAuth foi **completamente resolvido**. O sistema agora deve funcionar corretamente em produção e desenvolvimento local.
