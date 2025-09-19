# CodeArena - Plataforma de Programação Acadêmica

CodeArena é uma plataforma educacional que conecta professores e alunos através de exercícios de programação, correção automática e acompanhamento de progresso em tempo real.

## 🚀 Características

- **Autenticação Segura**: Login com Google para alunos e professores, sistema de convites para professores
- **Editor de Código Online**: Monaco Editor (mesmo do VS Code) com suporte a múltiplas linguagens
- **Correção Automática**: Integração com Judge0 API para execução segura de códigos
- **Dashboard Personalizado**: Interfaces específicas para Super Admin, Professores e Alunos
- **Sistema de Turmas**: Professores podem criar turmas e gerenciar alunos
- **Exercícios Interativos**: Criação de exercícios com casos de teste e correção automática
- **Relatórios e Estatísticas**: Acompanhamento de progresso e desempenho

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Autenticação**: NextAuth.js
- **Banco de Dados**: MongoDB Atlas
- **Editor de Código**: Monaco Editor
- **Execução de Código**: Judge0 API
- **Deploy**: Vercel (Frontend) + Render (Backend)

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no MongoDB Atlas
- Conta no Google Cloud Console (para OAuth)
- Conta no RapidAPI (para Judge0)

## ⚙️ Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd codearena
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. 🚀 Use o Admin Panel (Recomendado)

Para facilitar o gerenciamento da aplicação, use o **CodeArena Admin Panel**:

```bash
# Windows
admin.bat

# Linux/macOS
./admin.sh

# Ou diretamente com Node.js
npm run admin
```

O Admin Panel oferece um menu interativo com todas as opções necessárias:
- ✅ Setup completo automático
- ✅ Iniciar/parar servidor
- ✅ Inicializar super admin
- ✅ Executar testes e verificações
- ✅ Build e deploy
- ✅ Monitoramento de status

**Para primeira execução, escolha a opção 11 (Setup Completo)!**

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codearena

# Judge0 API
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your-judge0-api-key

# Superadmin
SUPERADMIN_EMAIL=admin@rsystem.com
SUPERADMIN_PASSWORD=@Desbravadores@93
```

### 5. Configure o Google OAuth

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a Google+ API
4. Crie credenciais OAuth 2.0
5. Adicione `http://localhost:3000/api/auth/callback/google` como URL de redirecionamento
6. Copie o Client ID e Client Secret para o arquivo `.env.local`

### 6. Configure o MongoDB Atlas

1. Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie um cluster gratuito
3. Configure um usuário do banco de dados
4. Adicione seu IP à whitelist
5. Copie a string de conexão para o arquivo `.env.local`

### 7. Configure o Judge0 API

1. Crie uma conta no [RapidAPI](https://rapidapi.com/)
2. Assine o plano gratuito do Judge0 CE
3. Copie a API Key para o arquivo `.env.local`

### 8. Execute o projeto

```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

**💡 Dica**: Use o Admin Panel (`npm run admin`) para facilitar o gerenciamento da aplicação!

## 👥 Perfis de Usuário

### Super Admin
- **Login**: Email: `admin@rsystem.com`, Senha: `@Desbravadores@93`
- **Funcionalidades**: Convidar professores, monitorar sistema

### Professor
- **Criação**: Apenas via convite do Super Admin
- **Login**: Google OAuth
- **Funcionalidades**: Criar turmas, exercícios, atividades, relatórios

### Aluno
- **Criação**: Automática no primeiro login com Google
- **Login**: Google OAuth
- **Funcionalidades**: Entrar em turmas, resolver exercícios, ver progresso

## 🎯 Linguagens Suportadas

- Python
- Java
- C
- C++
- JavaScript

## 📁 Estrutura do Projeto

```
codearena/
├── app/                    # App Router do Next.js
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard principal
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── dashboard/         # Componentes do dashboard
│   └── CodeEditor.tsx     # Editor de código
├── lib/                   # Utilitários e configurações
│   ├── auth.ts           # Configuração NextAuth
│   ├── mongodb.ts        # Conexão MongoDB
│   └── judge0.ts         # Integração Judge0
├── models/               # Modelos do MongoDB
└── types/                # Definições TypeScript
```

## 🚀 Deploy

### Frontend (Vercel)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Backend (Render)

1. Conecte seu repositório ao Render
2. Configure as variáveis de ambiente
3. Deploy automático

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se todas as variáveis de ambiente estão configuradas corretamente
2. Certifique-se de que todas as dependências estão instaladas
3. Verifique os logs do console para erros
4. Abra uma issue no repositório

## 🔮 Roadmap

- [ ] Sistema de ranking e gamificação
- [ ] Suporte a mais linguagens de programação
- [ ] Editor colaborativo em tempo real
- [ ] Sistema de notificações
- [ ] API pública para integração com outras plataformas
- [ ] App mobile
- [ ] Sistema de badges e conquistas

---

Desenvolvido com ❤️ para a educação em programação.
