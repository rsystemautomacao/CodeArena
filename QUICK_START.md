# 🚀 CodeArena - Início Rápido

Este guia te ajudará a colocar o CodeArena funcionando em **menos de 5 minutos**!

## ⚡ Início Super Rápido

### 1. Clone e Instale
```bash
git clone <seu-repositorio>
cd codearena
npm install
```

### 2. Execute o Admin Panel
```bash
# Windows
admin.bat

# Linux/macOS
./admin.sh

# Ou diretamente
npm run admin
```

### 3. Escolha Setup Completo
No menu, escolha a opção **11** (Setup Completo).

### 4. Configure as Variáveis
O script criará automaticamente o arquivo `.env.local`. Configure:

```env
# MongoDB (obrigatório)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codearena

# Google OAuth (obrigatório)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret

# Judge0 (obrigatório)
JUDGE0_API_KEY=sua-api-key

# NextAuth (obrigatório)
NEXTAUTH_SECRET=sua-chave-secreta-super-segura
NEXTAUTH_URL=http://localhost:3000
```

### 5. Pronto! 🎉
A aplicação estará rodando em `http://localhost:3000`

## 🔑 Credenciais de Acesso

### Super Admin
- **Email**: `admin@rsystem.com`
- **Senha**: `@Desbravadores@93`

### Professores
- Criados via convite do Super Admin
- Login com Google

### Alunos
- Login automático com Google
- Entram em turmas via código de convite

## 🎯 Fluxo de Uso

### Para Professores:
1. **Super Admin** convida professor via email
2. **Professor** ativa conta com Google
3. **Professor** cria turmas e exercícios
4. **Professor** compartilha código de turma com alunos

### Para Alunos:
1. **Aluno** faz login com Google
2. **Aluno** entra em turma com código
3. **Aluno** resolve exercícios
4. **Aluno** vê resultados automáticos

## 🛠️ Comandos Úteis do Admin Panel

| Opção | Comando | Descrição |
|-------|---------|-----------|
| 1 | Iniciar Servidor | Inicia desenvolvimento |
| 2 | Parar Servidor | Para o servidor |
| 3 | Reiniciar | Reinicia servidor |
| 4 | Super Admin | Cria usuário admin |
| 8 | Status | Verifica tudo |
| 11 | Setup Completo | Configura tudo |

## 🚨 Solução de Problemas

### Erro de Conexão MongoDB
```bash
# Verifique se a string de conexão está correta
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codearena
```

### Erro Google OAuth
```bash
# Verifique se as credenciais estão corretas
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
```

### Erro Judge0
```bash
# Verifique se a API key está correta
JUDGE0_API_KEY=sua-api-key
```

### Servidor não inicia
```bash
# Use o Admin Panel opção 10 (Limpar Cache)
# Depois opção 1 (Iniciar Servidor)
```

## 📱 Teste Rápido

1. **Acesse**: `http://localhost:3000`
2. **Login Super Admin**: `admin@rsystem.com` / `@Desbravadores@93`
3. **Convide um professor** (use seu email)
4. **Faça login como professor** com Google
5. **Crie uma turma** e anote o código
6. **Crie um exercício** simples
7. **Faça login como aluno** com outro email Google
8. **Entre na turma** com o código
9. **Resolva o exercício** no editor

## 🎉 Pronto!

Agora você tem o CodeArena funcionando perfeitamente! 

### Próximos Passos:
- 📚 Leia a documentação completa
- 🎨 Personalize a interface
- 👥 Convide mais professores
- 📊 Configure relatórios
- 🚀 Faça deploy em produção

---

**💡 Dica**: Mantenha o Admin Panel aberto durante o desenvolvimento para acesso rápido a todas as funcionalidades!
