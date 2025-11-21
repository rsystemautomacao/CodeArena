# Correções Necessárias na Página do Aluno - CodeArena

## Contexto
Estamos trabalhando APENAS na página do aluno. As alterações na página do professor NÃO devem ser modificadas.

## Problemas Identificados e Correções Necessárias

### 1. **Header do Aluno - Trocar "ALUNO" pelo Nome do Aluno**
- **Localização**: `components/dashboard/StudentDashboard.tsx`
- **Problema**: No header está escrito "Aluno" ao lado do nome "CodeArena"
- **Correção Necessária**: Substituir o badge/texto "Aluno" pelo nome completo do aluno que foi cadastrado no perfil
- **Status**: Parcialmente corrigido, mas precisa verificar se está funcionando corretamente

### 2. **Código Pré-preenchido no Editor de Exercícios**
- **Localização**: `components/CodeEditor.tsx` e `app/dashboard/exercise/[id]/page.tsx`
- **Problema**: Ao acessar um exercício, o editor já está mostrando código pré-preenchido (código de exemplo criado pelo professor)
- **Correção Necessária**: 
  - O aluno deve ver um editor VAZIO ou com apenas um comentário básico como `# Escreva seu código Python aqui`
  - NÃO deve mostrar código funcional pré-preenchido
  - O aluno deve escrever TODO o código do zero
- **Status**: Parcialmente corrigido, mas precisa verificar se está realmente vazio

### 3. **Cores do Editor - Texto Não Legível**
- **Localização**: `components/CodeEditor.tsx`
- **Problema**: As cores das letras estão da mesma cor do fundo, impossibilitando a leitura
- **Correção Necessária**: 
  - Ajustar o tema do Monaco Editor para ter contraste adequado
  - Garantir que texto seja legível (preto sobre branco ou claro sobre escuro com bom contraste)
- **Status**: Alterado para `vs-dark`, mas pode precisar de ajustes

### 4. **Opção de Criar Atividades para Alunos**
- **Localização**: `app/dashboard/assignments/page.tsx`
- **Problema**: Alunos ainda veem botões "Nova Atividade" e "Criar Primeira Atividade"
- **Correção Necessária**: 
  - Alunos NÃO podem criar, editar ou excluir atividades
  - Alunos podem APENAS visualizar e responder atividades disponíveis
  - Ocultar completamente os botões de criar/editar/excluir para alunos
  - Adicionar verificação de role (`session?.user?.role === 'aluno'`) para ocultar esses elementos
- **Status**: Parcialmente corrigido, mas precisa verificar

### 5. **Erro ao Entrar em Turma (Código de Convite)**
- **Localização**: `app/api/classrooms/join/route.ts`
- **Problema**: Ao colar o código da turma criado pelo professor, está dando erro 500 no servidor
- **Correção Necessária**: 
  - Verificar tratamento de erro na API
  - Garantir que ObjectId está sendo criado corretamente
  - Adicionar logs detalhados para debug
  - Verificar se o modelo Classroom está sendo importado corretamente
  - Verificar se mongoose.connection.db não é undefined
- **Status**: Adicionado melhor tratamento de erro, mas erro 500 ainda persiste

### 6. **Página de Exercícios para Aluno**
- **Localização**: `app/dashboard/exercises/page.tsx`
- **Problema**: Alunos não devem ter opções de criar/editar/excluir exercícios
- **Correção Necessária**: 
  - Alunos podem APENAS visualizar e resolver exercícios públicos
  - Ocultar botões de criar/editar/excluir para alunos
  - Mudar título para "Exercícios Públicos" quando for aluno
  - Adicionar verificação de role
- **Status**: Parcialmente corrigido

### 7. **Página de Submissões para Aluno**
- **Localização**: `app/dashboard/submissions/page.tsx`
- **Status**: Página criada, mas precisa verificar se está funcionando corretamente
- **Correção Necessária**: 
  - Garantir que a página lista todas as submissões do aluno
  - Mostrar detalhes completos de cada submissão
  - Permitir visualizar código submetido e resultados

### 8. **Erros 500 nas APIs**
- **Problema**: Múltiplos erros 500 no console para:
  - `GET /api/classrooms` - 500
  - `GET /api/assignments` - 500  
  - `GET /api/submissions?limit=5` - 500
  - `POST /api/classrooms/join` - 500
- **Correção Necessária**: 
  - Verificar se todos os modelos estão sendo importados corretamente (User, Classroom, Assignment, Exercise, Submission)
  - Verificar se mongoose.connection.db não é undefined em nenhum lugar
  - Garantir que ObjectId está sendo criado corretamente para todas as queries
  - Adicionar tratamento de erro adequado em todas as APIs
  - Verificar se os modelos estão registrados antes de usar

### 9. **Sidebar do Aluno**
- **Localização**: `components/dashboard/StudentSidebar.tsx`
- **Correção Necessária**: 
  - Garantir que apenas opções relevantes para aluno aparecem
  - NÃO incluir opções de criar turmas, exercícios ou atividades
  - Menu deve ter: Dashboard, Minhas Turmas, Atividades, Exercícios Públicos, Minhas Submissões, Perfil

### 10. **Buscar Exercício da API Real**
- **Localização**: `app/dashboard/exercise/[id]/page.tsx`
- **Problema**: Página estava usando dados mockados em vez de buscar da API
- **Correção Necessária**: 
  - Fazer fetch real de `/api/exercises/[id]`
  - Remover dados mockados
  - Tratar erros adequadamente

## Arquivos que Precisam ser Modificados

1. `components/dashboard/StudentDashboard.tsx` - Header com nome do aluno
2. `components/dashboard/StudentSidebar.tsx` - Menu do aluno
3. `components/CodeEditor.tsx` - Remover código pré-preenchido, corrigir cores
4. `app/dashboard/exercise/[id]/page.tsx` - Buscar da API real, não mostrar código pré-preenchido
5. `app/dashboard/assignments/page.tsx` - Ocultar opções de criar/editar para alunos
6. `app/dashboard/exercises/page.tsx` - Ocultar opções de criar/editar para alunos
7. `app/api/classrooms/join/route.ts` - Corrigir erro 500
8. `app/api/classrooms/route.ts` - Corrigir erro 500
9. `app/api/assignments/route.ts` - Corrigir erro 500
10. `app/api/submissions/route.ts` - Corrigir erro 500
11. `models/Submission.ts` - Garantir imports corretos

## Requisitos Importantes

- **Lembrar**: Estamos trabalhando APENAS na página do aluno
- **Não modificar**: Funcionalidades da página do professor
- **Princípio**: Aluno não pode criar, editar ou excluir nada - apenas resolver exercícios e visualizar conteúdo disponibilizado pelos professores
- **Funcionalidade esperada**: Similar ao Beecrowd - aluno resolve exercícios disponíveis, não cria nada

## Verificações Necessárias

1. Verificar se todas as APIs estão retornando dados corretamente (sem erro 500)
2. Verificar se o código do editor está realmente vazio para alunos
3. Verificar se as cores do editor estão legíveis
4. Verificar se todos os botões de criar/editar/excluir estão ocultos para alunos
5. Verificar se o nome do aluno aparece corretamente no header
6. Verificar se entrar em turma está funcionando sem erro 500
7. Verificar se a página de submissões está funcionando corretamente

## Logs e Debug

Todos os erros 500 precisam ter logs detalhados para identificar a causa raiz:
- Stack trace completo
- Mensagem de erro
- Código de erro
- Informações de debug (em desenvolvimento)

