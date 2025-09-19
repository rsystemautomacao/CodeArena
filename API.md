# CodeArena API Documentation

Esta documentação descreve as rotas da API do CodeArena.

## Autenticação

A API usa NextAuth.js para autenticação. Todas as rotas protegidas requerem um token de sessão válido.

### Headers Obrigatórios
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Endpoints

### Autenticação

#### POST /api/auth/signin
Faz login do usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

#### POST /api/auth/signout
Faz logout do usuário.

### Usuários

#### GET /api/users/me
Retorna informações do usuário logado.

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "Nome do Usuário",
    "email": "user@example.com",
    "role": "aluno|professor|superadmin",
    "image": "url_da_imagem"
  }
}
```

### Convites

#### POST /api/invites
Cria um convite para professor (apenas superadmin).

**Body:**
```json
{
  "email": "professor@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "inviteUrl": "http://localhost:3000/auth/invite/token123",
  "message": "Convite criado com sucesso"
}
```

#### GET /api/invites/validate/[token]
Valida um token de convite.

**Response:**
```json
{
  "valid": true,
  "email": "professor@example.com"
}
```

### Turmas

#### POST /api/classrooms
Cria uma nova turma (apenas professores).

**Body:**
```json
{
  "name": "Nome da Turma",
  "description": "Descrição da turma"
}
```

**Response:**
```json
{
  "success": true,
  "classroom": {
    "_id": "classroom_id",
    "name": "Nome da Turma",
    "description": "Descrição da turma",
    "inviteCode": "ABC123",
    "students": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/classrooms
Lista turmas do usuário.

**Response:**
```json
{
  "classrooms": [
    {
      "_id": "classroom_id",
      "name": "Nome da Turma",
      "description": "Descrição da turma",
      "inviteCode": "ABC123",
      "students": [
        {
          "_id": "student_id",
          "name": "Nome do Aluno",
          "email": "aluno@example.com"
        }
      ],
      "professor": {
        "_id": "professor_id",
        "name": "Nome do Professor",
        "email": "professor@example.com"
      }
    }
  ]
}
```

#### POST /api/classrooms/join
Entra em uma turma usando código de convite (apenas alunos).

**Body:**
```json
{
  "inviteCode": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Você entrou na turma com sucesso!",
  "classroom": {
    "_id": "classroom_id",
    "name": "Nome da Turma",
    "description": "Descrição da turma"
  }
}
```

### Exercícios

#### POST /api/exercises
Cria um novo exercício (apenas professores).

**Body:**
```json
{
  "title": "Título do Exercício",
  "description": "Descrição do exercício",
  "examples": [
    {
      "input": "5 3",
      "expectedOutput": "8",
      "isHidden": false
    }
  ],
  "testCases": [
    {
      "input": "10 20",
      "expectedOutput": "30",
      "isHidden": true
    }
  ],
  "timeLimit": 2,
  "memoryLimit": 128,
  "difficulty": "facil",
  "tags": ["matemática", "básico"]
}
```

**Response:**
```json
{
  "success": true,
  "exercise": {
    "_id": "exercise_id",
    "title": "Título do Exercício",
    "description": "Descrição do exercício",
    "examples": [...],
    "timeLimit": 2,
    "memoryLimit": 128,
    "difficulty": "facil",
    "tags": ["matemática", "básico"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/exercises
Lista exercícios disponíveis.

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `difficulty`: Filtrar por dificuldade (facil|medio|dificil)
- `tag`: Filtrar por tag

**Response:**
```json
{
  "exercises": [
    {
      "_id": "exercise_id",
      "title": "Título do Exercício",
      "description": "Descrição do exercício",
      "examples": [...],
      "timeLimit": 2,
      "memoryLimit": 128,
      "difficulty": "facil",
      "tags": ["matemática", "básico"],
      "createdBy": {
        "_id": "professor_id",
        "name": "Nome do Professor"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### GET /api/exercises/[id]
Busca um exercício específico.

**Response:**
```json
{
  "exercise": {
    "_id": "exercise_id",
    "title": "Título do Exercício",
    "description": "Descrição do exercício",
    "examples": [...],
    "testCases": [...], // Apenas para professores
    "timeLimit": 2,
    "memoryLimit": 128,
    "difficulty": "facil",
    "tags": ["matemática", "básico"],
    "createdBy": {
      "_id": "professor_id",
      "name": "Nome do Professor"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/exercises/[id]
Atualiza um exercício (apenas o criador).

#### DELETE /api/exercises/[id]
Exclui um exercício (apenas o criador).

### Submissões

#### POST /api/submissions
Submete código para um exercício.

**Body:**
```json
{
  "exerciseId": "exercise_id",
  "code": "print('Hello World')",
  "language": "python",
  "assignmentId": "assignment_id" // opcional
}
```

**Response:**
```json
{
  "success": true,
  "submissionId": "submission_id",
  "status": "accepted",
  "message": "Resposta correta",
  "testResults": [
    {
      "testCase": 1,
      "status": "accepted",
      "message": "Resposta correta",
      "time": 0.1,
      "memory": 1024
    }
  ],
  "passedTests": 3,
  "totalTests": 3
}
```

#### GET /api/submissions
Lista submissões do usuário.

**Query Parameters:**
- `exerciseId`: Filtrar por exercício
- `assignmentId`: Filtrar por atividade
- `page`: Número da página
- `limit`: Itens por página

**Response:**
```json
{
  "submissions": [
    {
      "_id": "submission_id",
      "exercise": {
        "_id": "exercise_id",
        "title": "Título do Exercício"
      },
      "assignment": {
        "_id": "assignment_id",
        "title": "Título da Atividade"
      },
      "status": "accepted",
      "result": {
        "status": "accepted",
        "message": "Resposta correta",
        "testCases": {
          "passed": 3,
          "total": 3
        },
        "time": 0.1,
        "memory": 1024
      },
      "submittedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### Teste de Código

#### POST /api/test-code
Testa código sem submeter (para debug).

**Body:**
```json
{
  "code": "print('Hello World')",
  "language": "python",
  "input": "5 3",
  "timeLimit": 2,
  "memoryLimit": 128
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "output": "8",
    "time": 0.1,
    "memory": 1024,
    "status": "accepted",
    "message": "Executado com sucesso"
  }
}
```

## Códigos de Status

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos
- `401`: Não autorizado
- `403`: Acesso negado
- `404`: Não encontrado
- `500`: Erro interno do servidor

## Linguagens Suportadas

- `python`: Python 3
- `java`: Java 11
- `c`: C (GCC 9.2.0)
- `cpp`: C++ (GCC 9.2.0)
- `javascript`: Node.js 12.14.0

## Status de Submissão

- `accepted`: Aceito
- `wrong_answer`: Resposta incorreta
- `time_limit_exceeded`: Tempo limite excedido
- `runtime_error`: Erro de execução
- `compilation_error`: Erro de compilação
- `memory_limit_exceeded`: Limite de memória excedido
- `pending`: Pendente
- `processing`: Processando
