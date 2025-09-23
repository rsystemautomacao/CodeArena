# 🔧 Correção do Google OAuth - Erro 500

## 🚨 Problema
Erro 500 do Google ao tentar fazer login/cadastro em produção.

## 🔍 Diagnóstico
O erro 500 geralmente é causado por:
1. **redirect_uri_mismatch** - URL de redirecionamento não autorizada
2. **Configurações incorretas no Google Console**
3. **Variáveis de ambiente incorretas**

## ✅ Solução Passo a Passo

### 1️⃣ Verificar URLs Atuais
Acesse: `https://code-arena-unasp.vercel.app/api/auth/debug`

Isso mostrará as URLs esperadas que devem estar configuradas no Google Console.

### 2️⃣ Configurar Google Console

#### A. Acessar Google Cloud Console
1. Vá para: https://console.cloud.google.com/
2. Selecione seu projeto
3. Vá para "APIs e Serviços" > "Credenciais"

#### B. Editar OAuth 2.0 Client IDs
1. Clique no seu OAuth 2.0 Client ID
2. Em "URIs de redirecionamento autorizados", adicione:
   ```
   https://code-arena-unasp.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

#### C. Em "Origens JavaScript autorizadas", adicione:
   ```
   https://code-arena-unasp.vercel.app
   http://localhost:3000
   ```

### 3️⃣ Verificar Variáveis de Ambiente no Vercel

No Vercel Dashboard, verifique se estas variáveis estão configuradas:

```
NEXTAUTH_URL=https://code-arena-unasp.vercel.app
NEXTAUTH_SECRET=[sua-secret-aqui]
GOOGLE_CLIENT_ID=[seu-client-id]
GOOGLE_CLIENT_SECRET=[seu-client-secret]
```

### 4️⃣ Testar a Configuração

1. Acesse: `https://code-arena-unasp.vercel.app/api/auth/debug`
2. Verifique se todas as URLs estão corretas
3. Teste o login com Google

## 🔧 URLs Importantes

### Produção (Vercel):
- **Callback URL**: `https://code-arena-unasp.vercel.app/api/auth/callback/google`
- **Origin**: `https://code-arena-unasp.vercel.app`

### Desenvolvimento:
- **Callback URL**: `http://localhost:3000/api/auth/callback/google`
- **Origin**: `http://localhost:3000`

## 🚨 Erros Comuns

### "redirect_uri_mismatch"
- ✅ **Solução**: Adicionar a URL exata no Google Console

### "invalid_client"
- ✅ **Solução**: Verificar se GOOGLE_CLIENT_ID está correto

### "unauthorized_client"
- ✅ **Solução**: Verificar se GOOGLE_CLIENT_SECRET está correto

## 📋 Checklist Final

- [ ] URLs de redirecionamento adicionadas no Google Console
- [ ] Origens JavaScript adicionadas no Google Console
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] NEXTAUTH_URL apontando para o domínio correto
- [ ] Teste realizado com sucesso

## 🆘 Se ainda não funcionar

1. Verifique os logs do Vercel
2. Confirme se o projeto Google está ativo
3. Verifique se as APIs do Google estão habilitadas
4. Teste com uma conta Google diferente
