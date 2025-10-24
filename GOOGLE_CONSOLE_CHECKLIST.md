# 🚨 CHECKLIST DEFINITIVO - GOOGLE CONSOLE

## 🎯 **PROBLEMA IDENTIFICADO:**
O erro 400 do Google indica que há um problema na configuração do Google Console, não no código.

## 🔧 **SOLUÇÃO DEFINITIVA:**

### **PASSO 1: Acessar Google Console**
1. Vá para: https://console.cloud.google.com/
2. **Selecione o projeto correto**
3. Vá para **"APIs e Serviços" > "Credenciais"**

### **PASSO 2: Verificar OAuth 2.0 Client ID**
1. **Clique no seu OAuth 2.0 Client ID**
2. **Verifique se o Client ID é**: `168148306709-7ko7fqfrj232igg6367eeaphgt9uvmsv.apps.googleusercontent.com`

### **PASSO 3: Configurar URLs EXATAS**

#### **Authorized redirect URIs:**
```
https://code-arena-unasp.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

#### **Authorized JavaScript origins:**
```
https://code-arena-unasp.vercel.app
http://localhost:3000
```

### **PASSO 4: Verificar Status do Projeto**
1. **Verifique se o projeto está ATIVO**
2. **Verifique se as APIs estão habilitadas:**
   - Google+ API (ou Google Identity API)
   - Google OAuth2 API

### **PASSO 5: Teste Direto**
Cole esta URL diretamente no navegador:
```
https://accounts.google.com/oauth/authorize?client_id=168148306709-7ko7fqfrj232igg6367eeaphgt9uvmsv.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fcode-arena-unasp.vercel.app%2Fapi%2Fauth%2Fcallback%2Fgoogle&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent
```

## 🚨 **SE AINDA DER ERRO 400:**

### **Possíveis Causas:**
1. **Client ID incorreto** - Verificar se está exato
2. **URL de redirecionamento incorreta** - Verificar se está exata
3. **Projeto inativo** - Verificar se está ativo
4. **APIs não habilitadas** - Verificar se estão habilitadas
5. **Domínio não autorizado** - Verificar origens JavaScript

### **Ações Imediatas:**
1. **Delete e recrie** o OAuth 2.0 Client ID
2. **Configure as URLs exatamente** como mostrado acima
3. **Aguarde 10-15 minutos** para propagação
4. **Teste em modo incógnito**

## 🎯 **RESULTADO ESPERADO:**
- ✅ **Antes**: Erro 400 "Isto é um erro" do Google
- ✅ **Depois**: Página do Google para seleção de conta
- ✅ **Fluxo**: Seleciona conta → Redireciona para dashboard

## 📞 **SE NADA FUNCIONAR:**
1. **Crie um novo projeto** no Google Console
2. **Configure as credenciais** do zero
3. **Atualize as variáveis** no Vercel
4. **Faça novo deploy**

**O problema É NO GOOGLE CONSOLE, não no código!** 🚀

