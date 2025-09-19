// Configurações do Judge0 API
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

// Mapeamento de linguagens suportadas
export const SUPPORTED_LANGUAGES = {
  python: { id: 71, name: 'Python', extension: 'py' },
  java: { id: 62, name: 'Java', extension: 'java' },
  c: { id: 50, name: 'C', extension: 'c' },
  cpp: { id: 54, name: 'C++', extension: 'cpp' },
  javascript: { id: 63, name: 'JavaScript', extension: 'js' },
};

// Mapeamento de status do Judge0 para português
export const STATUS_MESSAGES = {
  1: 'Em fila',
  2: 'Processando',
  3: 'Aceito',
  4: 'Resposta Incorreta',
  5: 'Tempo Excedido',
  6: 'Erro de Compilação',
  7: 'Erro de Execução',
  8: 'Erro de Execução',
  9: 'Erro de Execução',
  10: 'Erro de Execução',
  11: 'Erro de Execução',
  12: 'Erro de Execução',
  13: 'Erro de Execução',
  14: 'Erro de Execução',
  15: 'Erro de Execução',
};

export interface Judge0Submission {
  language_id: number;
  source_code: string;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: string;
  memory_limit?: string;
}

export interface Judge0Result {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  time?: string;
  memory?: number;
  status: {
    id: number;
    description: string;
  };
}

export async function submitCode(
  code: string,
  language: string,
  testCases: Array<{ input: string; expectedOutput: string }>,
  timeLimit: number = 2,
  memoryLimit: number = 128
): Promise<{
  success: boolean;
  results: Array<{
    testCase: number;
    status: string;
    message: string;
    time?: number;
    memory?: number;
    output?: string;
    expectedOutput?: string;
  }>;
  error?: string;
}> {
  try {
    const languageConfig = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES];
    if (!languageConfig) {
      return {
        success: false,
        results: [],
        error: 'Linguagem não suportada',
      };
    }

    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      const submission: Judge0Submission = {
        language_id: languageConfig.id,
        source_code: code,
        stdin: testCase.input,
        expected_output: testCase.expectedOutput,
        cpu_time_limit: timeLimit.toString(),
        memory_limit: (memoryLimit * 1024).toString(), // Convert MB to KB
      };

      // Submeter código
      const submitResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_API_KEY || '',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        body: JSON.stringify(submission),
      });

      if (!submitResponse.ok) {
        throw new Error(`Erro ao submeter código: ${submitResponse.statusText}`);
      }

      const submitData = await submitResponse.json();
      const token = submitData.token;

      // Aguardar resultado
      let result: Judge0Result | null = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos máximo

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo

        const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
          headers: {
            'X-RapidAPI-Key': JUDGE0_API_KEY || '',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
        });

        if (!resultResponse.ok) {
          throw new Error(`Erro ao obter resultado: ${resultResponse.statusText}`);
        }

        result = await resultResponse.json();

        // Se o status não é 1 (em fila) ou 2 (processando), o resultado está pronto
        if (result && result.status.id !== 1 && result.status.id !== 2) {
          break;
        }

        attempts++;
      }

      if (!result) {
        results.push({
          testCase: i + 1,
          status: 'time_limit_exceeded',
          message: 'Tempo limite excedido para obter resultado',
        });
        continue;
      }

      // Processar resultado
      let status = 'wrong_answer';
      let message = 'Resposta incorreta';

      switch (result.status.id) {
        case 3: // Accepted
          status = 'accepted';
          message = 'Resposta correta';
          break;
        case 4: // Wrong Answer
          status = 'wrong_answer';
          message = 'Resposta incorreta';
          break;
        case 5: // Time Limit Exceeded
          status = 'time_limit_exceeded';
          message = 'Tempo limite excedido';
          break;
        case 6: // Compilation Error
          status = 'compilation_error';
          message = 'Erro de compilação';
          break;
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
        case 13:
        case 14:
        case 15: // Runtime Error
          status = 'runtime_error';
          message = 'Erro de execução';
          break;
      }

      results.push({
        testCase: i + 1,
        status,
        message,
        time: result.time ? parseFloat(result.time) : undefined,
        memory: result.memory,
        output: result.stdout || result.stderr || result.compile_output,
        expectedOutput: testCase.expectedOutput,
      });
    }

    return {
      success: true,
      results,
    };
  } catch (error: any) {
    console.error('Erro no Judge0:', error);
    return {
      success: false,
      results: [],
      error: error.message || 'Erro interno do servidor',
    };
  }
}

export async function testCode(
  code: string,
  language: string,
  input: string,
  timeLimit: number = 2,
  memoryLimit: number = 128
): Promise<{
  success: boolean;
  result?: {
    output: string;
    time?: number;
    memory?: number;
    status: string;
    message: string;
  };
  error?: string;
}> {
  try {
    const languageConfig = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES];
    if (!languageConfig) {
      return {
        success: false,
        error: 'Linguagem não suportada',
      };
    }

    const submission: Judge0Submission = {
      language_id: languageConfig.id,
      source_code: code,
      stdin: input,
      cpu_time_limit: timeLimit.toString(),
      memory_limit: (memoryLimit * 1024).toString(),
    };

    // Submeter código
    const submitResponse = await fetch(`${JUDGE0_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY || '',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify(submission),
    });

    if (!submitResponse.ok) {
      throw new Error(`Erro ao submeter código: ${submitResponse.statusText}`);
    }

    const submitData = await submitResponse.json();
    const token = submitData.token;

    // Aguardar resultado
    let result: Judge0Result | null = null;
    let attempts = 0;
    const maxAttempts = 10; // 10 segundos máximo para teste

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultResponse = await fetch(`${JUDGE0_API_URL}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY || '',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
      });

      if (!resultResponse.ok) {
        throw new Error(`Erro ao obter resultado: ${resultResponse.statusText}`);
      }

      result = await resultResponse.json();

      if (result && result.status.id !== 1 && result.status.id !== 2) {
        break;
      }

      attempts++;
    }

    if (!result) {
      return {
        success: false,
        error: 'Tempo limite excedido para obter resultado',
      };
    }

    let status = 'runtime_error';
    let message = 'Erro de execução';

    switch (result.status.id) {
      case 3: // Accepted
        status = 'accepted';
        message = 'Executado com sucesso';
        break;
      case 5: // Time Limit Exceeded
        status = 'time_limit_exceeded';
        message = 'Tempo limite excedido';
        break;
      case 6: // Compilation Error
        status = 'compilation_error';
        message = 'Erro de compilação';
        break;
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
      case 15: // Runtime Error
        status = 'runtime_error';
        message = 'Erro de execução';
        break;
    }

    return {
      success: true,
      result: {
        output: result.stdout || result.stderr || result.compile_output || '',
        time: result.time ? parseFloat(result.time) : undefined,
        memory: result.memory,
        status,
        message,
      },
    };
  } catch (error: any) {
    console.error('Erro no Judge0:', error);
    return {
      success: false,
      error: error.message || 'Erro interno do servidor',
    };
  }
}
