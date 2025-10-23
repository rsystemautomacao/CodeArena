# 🚨 SOLUÇÃO DEFINITIVA PARA ERRO 400 DO GOOGLE OAUTH

## 🔍 **DIAGNÓSTICO DO ERRO 400**

O erro 400 "Isto é um erro" do Google indica que há um problema na configuração do OAuth. Vou te guiar passo a passo para resolver.

## 🎯 **CAUSAS MAIS COMUNS DO ERRO 400:**

### 1. **redirect_uri_mismatch** (90% dos casos)
- A URL de redirecionamento não está configurada corretamente no Google Console
- **URL exata necessária**: `https://code-arena-unasp.vercel.app/api/auth/callback/google`

### 2. **invalid_client** 
- Client ID incorreto ou inválido
- Verificar se `GOOGLE_CLIENT_ID` está correto

### 3. **unauthorized_client**
- Client Secret incorreto ou inválido  
- Verificar se `GOOGLE_CLIENT_SECRET` está correto

### 4. **domain_mismatch**
- Domínio não autorizado no Google Console
- Adicionar domínio nas origens autorizadas

## 🔧 **SOLUÇÃO PASSO A PASSO:**

### **PASSO 1: Verificar Google Console**

1. **Acesse**: https://console.cloud.google.com/
2. **Selecione seu projeto**
3. **Vá para**: "APIs e Serviços" > "Credenciais"
4. **Clique no seu OAuth 2.0 Client ID**

### **PASSO 2: Configurar URLs de Redirecionamento**

**Em "URIs de redirecionamento autorizados", adicione EXATAMENTE:**
```
https://code-arena-unasp.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

**⚠️ IMPORTANTE**: 
- Não adicione barra no final
- Use HTTPS para produção
- A URL deve ser EXATAMENTE como mostrado acima

### **PASSO 3: Configurar Origens JavaScript**

**Em "Origens JavaScript autorizadas", adicione:**
```
https://code-arena-unasp.vercel.app
http://localhost:3000
```

### **PASSO 4: Verificar Variáveis no Vercel**

No Vercel Dashboard, verifique se estas variáveis estão configuradas:

```env
NEXTAUTH_URL=https://code-arena-unasp.vercel.app
NEXTAUTH_SECRET=[sua-secret-aqui]
GOOGLE_CLIENT_ID=[seu-client-id]
GOOGLE_CLIENT_SECRET=[seu-client-secret]
```

### **PASSO 5: Verificar APIs Habilitadas**

No Google Console, vá para "APIs e Serviços" > "Biblioteca" e verifique se estas APIs estão habilitadas:

- ✅ **Google+ API** (ou Google Identity API)
- ✅ **Google OAuth2 API**

### **PASSO 6: Testar a Configuração**

1. **Acesse**: https://code-arena-unasp.vercel.app/auth/signin
2. **Clique em "Google"**
3. **Deve abrir a página do Google** (não mais erro 400)

## 🔍 **DEBUG AVANÇADO:**

### **Verificar URL Exata do Google:**
Acesse: https://code-arena-unasp.vercel.app/api/debug-google

### **Testar URL do Google Diretamente:**
```
https://accounts.google.com/oauth/authorize?
client_id=SEU_CLIENT_ID&
redirect_uri=https://code-arena-unasp.vercel.app/api/auth/callback/google&
response_type=code&
scope=openid email profile&
access_type=offline&
prompt=consent
```

## 🚨 **ERROS COMUNS E SOLUÇÕES:**

### **"redirect_uri_mismatch"**
- ✅ **Solução**: Verificar se a URL está EXATAMENTE como configurada no Google Console
- ✅ **Verificar**: Não há espaços extras, barras no final, ou caracteres especiais

### **"invalid_client"**
- ✅ **Solução**: Verificar se GOOGLE_CLIENT_ID está correto no Vercel
- ✅ **Verificar**: O Client ID deve terminar com `.apps.googleusercontent.com`

### **"unauthorized_client"**
- ✅ **Solução**: Verificar se GOOGLE_CLIENT_SECRET está correto no Vercel
- ✅ **Verificar**: O Client Secret deve começar com `GOCSPX-`

### **"access_denied"**
- ✅ **Solução**: Verificar se o projeto Google está ativo
- ✅ **Verificar**: Se as APIs estão habilitadas

## 📋 **CHECKLIST FINAL:**

- [ ] URLs de redirecionamento adicionadas no Google Console
- [ ] Origens JavaScript adicionadas no Google Console  
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] NEXTAUTH_URL apontando para o domínio correto
- [ ] APIs do Google habilitadas
- [ ] Projeto Google ativo
- [ ] Teste realizado com sucesso

## 🆘 **SE AINDA NÃO FUNCIONAR:**

1. **Aguarde 5-10 minutos** após fazer as alterações no Google Console
2. **Limpe o cache do navegador**
3. **Teste em modo incógnito**
4. **Verifique os logs do Vercel** para erros específicos
5. **Teste com uma conta Google diferente**

## 🎯 **RESULTADO ESPERADO:**

Após seguir todos os passos:
- ✅ **Antes**: Erro 400 "Isto é um erro" do Google
- ✅ **Depois**: Página do Google para seleção de conta
- ✅ **Fluxo**: Seleciona conta → Redireciona para dashboard

## 📞 **SUPORTE:**

Se ainda não funcionar, verifique:
1. **Logs do Vercel** para erros específicos
2. **Console do navegador** para erros JavaScript
3. **Network tab** para ver a requisição que está falhando
