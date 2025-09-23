# Guia de Deploy - CodeArena

Este guia explica como fazer o deploy da aplicação CodeArena em produção.

## 🚀 Deploy no Vercel (Recomendado)

### 1. Preparação

1. **Fork/Clone o repositório** no GitHub
2. **Configure as variáveis de ambiente** no arquivo `.env.local`
3. **Teste localmente** com `npm run dev`

### 2. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "New Project"
4. Importe o repositório do CodeArena
5. Configure as variáveis de ambiente:

```env
NEXTAUTH_URL=https://seu-projeto.vercel.app
NEXTAUTH_SECRET=sua-chave-secreta-super-segura
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
MONGODB_URI=sua-string-de-conexao-mongodb
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=sua-judge0-api-key
SUPERADMIN_EMAIL=seu-email@exemplo.com
SUPERADMIN_PASSWORD=sua-senha-segura
```

6. Clique em "Deploy"

### 3. Configurar Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em "APIs & Services" > "Credentials"
3. Edite suas credenciais OAuth 2.0
4. Adicione a URL de produção:
   - `https://seu-projeto.vercel.app/api/auth/callback/google`

### 4. Inicializar Super Admin

Após o deploy, execute o script para criar o super admin:

```bash
npm run init-superadmin
```

## 🐳 Deploy com Docker

### 1. Criar Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Criar docker-compose.yml

```yaml
version: '3.8'

services:
  codearena:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - MONGODB_URI=${MONGODB_URI}
      - JUDGE0_API_URL=${JUDGE0_API_URL}
      - JUDGE0_API_KEY=${JUDGE0_API_KEY}
      - SUPERADMIN_EMAIL=${SUPERADMIN_EMAIL}
      - SUPERADMIN_PASSWORD=${SUPERADMIN_PASSWORD}
    restart: unless-stopped
```

### 3. Deploy

```bash
docker-compose up -d
```

## 🌐 Deploy no Render

### 1. Preparação

1. Conecte seu repositório ao Render
2. Configure as variáveis de ambiente
3. Use o arquivo `render.yaml` incluído no projeto

### 2. Configuração

1. Acesse [render.com](https://render.com)
2. Crie um novo "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### 3. Variáveis de Ambiente

Configure todas as variáveis necessárias no painel do Render.

## 🔧 Deploy Manual (VPS)

### 1. Preparar Servidor

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm nginx certbot python3-certbot-nginx

# Instalar PM2
sudo npm install -g pm2
```

### 2. Configurar Aplicação

```bash
# Clonar repositório
git clone <seu-repositorio>
cd codearena

# Instalar dependências
npm install

# Build da aplicação
npm run build

# Configurar variáveis de ambiente
cp env.example .env.local
# Editar .env.local com suas configurações
```

### 3. Configurar Nginx

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Configurar SSL

```bash
sudo certbot --nginx -d seu-dominio.com
```

### 5. Iniciar Aplicação

```bash
# Com PM2
pm2 start npm --name "codearena" -- start
pm2 startup
pm2 save
```

## 📊 Monitoramento

### 1. Logs

```bash
# Vercel
vercel logs

# PM2
pm2 logs codearena

# Docker
docker logs <container-id>
```

### 2. Métricas

- **Vercel**: Dashboard integrado
- **Render**: Dashboard integrado
- **PM2**: `pm2 monit`

## 🔒 Segurança

### 1. Variáveis de Ambiente

- Nunca commite arquivos `.env`
- Use senhas fortes para `NEXTAUTH_SECRET`
- Mantenha as chaves da API seguras

### 2. HTTPS

- Sempre use HTTPS em produção
- Configure certificados SSL
- Force redirecionamento HTTPS

### 3. Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de CORS**
   - Verifique `NEXTAUTH_URL`
   - Configure domínios permitidos

2. **Erro de Conexão MongoDB**
   - Verifique `MONGODB_URI`
   - Configure IP whitelist

3. **Erro Google OAuth**
   - Verifique URLs de callback
   - Confirme credenciais

4. **Erro Judge0**
   - Verifique API key
   - Confirme limites de uso

### Logs de Debug

```bash
# Habilitar logs detalhados
DEBUG=* npm run dev

# Logs específicos
DEBUG=next-auth npm run dev
```

## 📈 Otimizações

### 1. Performance

- Use CDN para assets estáticos
- Configure cache headers
- Otimize imagens

### 2. Escalabilidade

- Use load balancer
- Configure múltiplas instâncias
- Use Redis para sessões

### 3. Monitoramento

- Configure alertas
- Monitore métricas
- Use ferramentas de APM

## 🔄 CI/CD

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 Suporte

Para problemas de deploy:

1. Verifique os logs
2. Confirme variáveis de ambiente
3. Teste localmente
4. Abra uma issue no GitHub

---

**Importante**: Sempre teste em ambiente de desenvolvimento antes de fazer deploy em produção!
