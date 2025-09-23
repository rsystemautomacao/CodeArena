# 🚀 CodeArena Admin Panel

O **CodeArena Admin Panel** é um script de administração interativo que facilita o gerenciamento, teste e deploy da aplicação CodeArena.

## 🎯 Como Usar

### Iniciar o Admin Panel

```bash
npm run admin
```

Ou diretamente:

```bash
node admin.js
```

### Menu Principal

O script apresenta um menu interativo com as seguintes opções:

```
╔══════════════════════════════════════════════════════════════╗
║                    🚀 CodeArena Admin Panel                 ║
║              Sistema de Administração e Testes              ║
╚══════════════════════════════════════════════════════════════╝

📋 Menu Principal:

1️⃣  🚀 Iniciar Servidor de Desenvolvimento
2️⃣  🛑 Parar Servidor
3️⃣  🔄 Reiniciar Servidor
4️⃣  👑 Inicializar Super Admin
5️⃣  🧪 Executar Testes
6️⃣  🔍 Verificar Código (Lint)
7️⃣  🏗️  Fazer Build
8️⃣  📊 Verificar Status
9️⃣  🌐 Abrir Navegador
🔟  🧹 Limpar Cache
1️⃣1️⃣  🚀 Setup Completo (Tudo)
1️⃣2️⃣  📋 Ver Logs do Servidor
0️⃣  ❌ Sair
```

## 🔧 Funcionalidades

### 1️⃣ Iniciar Servidor de Desenvolvimento
- Inicia o servidor Next.js em modo de desenvolvimento
- Acessível em `http://localhost:3000`
- Hot reload automático

### 2️⃣ Parar Servidor
- Para o servidor de desenvolvimento
- Libera a porta 3000

### 3️⃣ Reiniciar Servidor
- Para e reinicia o servidor
- Útil após mudanças de configuração

### 4️⃣ Inicializar Super Admin
- Cria o usuário super admin no banco de dados
- **Login**: Configurado nas variáveis de ambiente
- **Senha**: Configurada nas variáveis de ambiente

### 5️⃣ Executar Testes
- Executa todos os testes da aplicação
- Mostra relatório de resultados

### 6️⃣ Verificar Código (Lint)
- Executa ESLint para verificar qualidade do código
- Identifica problemas de formatação e boas práticas

### 7️⃣ Fazer Build
- Compila a aplicação para produção
- Verifica se não há erros de compilação

### 8️⃣ Verificar Status
- Mostra status de todos os serviços:
  - ✅ Servidor de desenvolvimento
  - ✅ Arquivo .env.local
  - ✅ Dependências instaladas

### 9️⃣ Abrir Navegador
- Abre automaticamente o navegador em `http://localhost:3000`
- Funciona no Windows, macOS e Linux

### 🔟 Limpar Cache
- Remove cache do Next.js
- Remove cache do npm
- Útil para resolver problemas de cache

### 1️⃣1️⃣ Setup Completo
- **Executa tudo automaticamente**:
  1. Verifica/cria arquivo .env.local
  2. Instala dependências
  3. Executa linting
  4. Faz build da aplicação
  5. Inicializa super admin
  6. Inicia servidor
- **Ideal para primeira execução**

### 1️⃣2️⃣ Ver Logs do Servidor
- Mostra logs em tempo real do servidor
- Pressione `Ctrl+C` para voltar ao menu

## 🎨 Recursos Visuais

- **Cores no terminal** para melhor visualização
- **Emojis** para identificação rápida
- **Status em tempo real** dos serviços
- **Interface limpa** e organizada

## ⚡ Atalhos

- **Ctrl+C**: Interrompe qualquer operação e volta ao menu
- **Enter**: Continua após cada operação
- **0**: Sai do programa

## 🔍 Verificações Automáticas

O script verifica automaticamente:

- ✅ Se está no diretório correto (com package.json)
- ✅ Se o arquivo .env.local existe
- ✅ Se as dependências estão instaladas
- ✅ Se o servidor está rodando

## 🚨 Tratamento de Erros

- **Erros de dependências**: Oferece instalação automática
- **Arquivo .env ausente**: Cria automaticamente do env.example
- **Servidor já rodando**: Avisa e oferece opções
- **Processos órfãos**: Limpa automaticamente ao sair

## 📋 Exemplo de Uso

```bash
# Primeira vez usando o projeto
npm run admin
# Escolha opção 11 (Setup Completo)

# Uso diário
npm run admin
# Escolha opção 1 (Iniciar Servidor)

# Para desenvolvimento
npm run admin
# Escolha opção 6 (Verificar Código)
# Escolha opção 7 (Fazer Build)
```

## 🛠️ Configuração

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Arquivo .env.local configurado

### Primeira Execução
1. Execute `npm run admin`
2. Escolha opção **11** (Setup Completo)
3. Configure as variáveis de ambiente quando solicitado
4. Aguarde a conclusão do setup

## 🔧 Personalização

O script pode ser personalizado editando o arquivo `admin.js`:

- **Cores**: Modifique o objeto `colors`
- **Comandos**: Altere as funções de execução
- **Menu**: Adicione novas opções
- **Verificações**: Inclua novas validações

## 📞 Suporte

Se encontrar problemas:

1. **Verifique o status** (opção 8)
2. **Limpe o cache** (opção 10)
3. **Execute setup completo** (opção 11)
4. **Verifique os logs** (opção 12)

## 🎯 Dicas de Uso

- **Desenvolvimento**: Use opções 1, 6, 7
- **Testes**: Use opções 5, 8
- **Produção**: Use opções 7, 11
- **Manutenção**: Use opções 8, 10, 12

---

**💡 Dica**: Mantenha o Admin Panel aberto durante o desenvolvimento para acesso rápido a todas as funcionalidades!
