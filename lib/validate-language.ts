/**
 * Valida se o código corresponde à linguagem selecionada
 */

export function validateLanguageMatch(code: string, selectedLanguage: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedCode = code.trim();
  
  // Padrões que indicam linguagens específicas
  const languagePatterns = {
    python: [
      /^#!.*python/i,  // shebang
      /\b(def|import|from|as|if __name__|print\(|lambda|yield|async|await)\b/,
      /:\s*$/m,  // indentation (Python usa :)
    ],
    java: [
      /^\s*(public|private|protected)\s+(class|interface|enum)/m,
      /\bpublic\s+static\s+void\s+main\s*\(/,
      /\bSystem\.(out|in)\./,
      /\b(extends|implements)\s+\w+/,
    ],
    c: [
      /^\s*#include\s*[<"].*\.h[>"]/m,
      /\b(printf|scanf|#include|#define|int main\(|void main\(|main\(\))/,
      /\b(sizeof|malloc|free|strlen|strcpy)\s*\(/,
    ],
    cpp: [
      /^\s*#include\s*[<"].*[>"]/m,
      /\b(cin|cout|endl|namespace std|using namespace|#include <iostream>)/,
      /\b(std::|vector|string|map|set)\s*</,
    ],
    javascript: [
      /^\s*(function|const|let|var)\s+\w+/m,
      /\b(console\.(log|error|warn|info)|require\(|module\.exports|export|import)/,
      /=>\s*(\(|{)/,  // arrow function
      /\b(document\.|window\.|process\.)/,
    ],
  };

  const selectedPatterns = languagePatterns[selectedLanguage as keyof typeof languagePatterns];
  
  if (!selectedPatterns) {
    return { isValid: false, error: 'Linguagem não suportada' };
  }

  // Detectar padrões de outras linguagens (incorretas)
  const otherLanguagePatterns: Record<string, RegExp[]> = {
    python: [
      /\b(printf|scanf|#include|int main\(|function |const |let |var )/,
      /System\.(out|in)\./,
    ],
    java: [
      /#include|printf|scanf|console\.log|def |import sys|print\(/,
    ],
    c: [
      /console\.log|def |function |const |let |var |System\.(out|in)\.|import |from |print\(/,
      /\b(class |interface |extends |implements )/,
    ],
    cpp: [
      /console\.log|def |function |const |let |var |System\.(out|in)\.|import |from |print\(/,
    ],
    javascript: [
      /#include|printf|scanf|int main\(|public static void main|def |import sys/,
      /System\.(out|in)\./,
    ],
  };

  // Verificar se há padrões de outras linguagens (mais forte)
  const otherPatterns = otherLanguagePatterns[selectedLanguage as keyof typeof otherLanguagePatterns];
  if (otherPatterns) {
    for (const pattern of otherPatterns) {
      if (pattern.test(trimmedCode)) {
        const detectedLanguage = detectLanguageFromCode(code);
        return {
          isValid: false,
          error: `O código parece ser ${detectedLanguage}, mas você selecionou ${selectedLanguage}. Por favor, selecione a linguagem correta ou corrija o código.`
        };
      }
    }
  }

  // Verificar se há padrões da linguagem correta
  for (const pattern of selectedPatterns) {
    if (pattern.test(trimmedCode)) {
      return { isValid: true };
    }
  }

  // Se não encontrou padrões específicos, pode ser código muito básico
  // Nesse caso, não rejeitamos, mas o Judge0 vai validar
  return { isValid: true };
}

function detectLanguageFromCode(code: string): string {
  const trimmedCode = code.trim();
  
  if (/#include|printf|scanf|int main\(/.test(trimmedCode)) {
    if (/cin|cout|namespace std|using namespace/.test(trimmedCode)) {
      return 'C++';
    }
    return 'C';
  }
  if (/public static void main|System\.(out|in)\.|class \w+ extends/.test(trimmedCode)) {
    return 'Java';
  }
  if (/def |import |from |print\(|lambda|yield|async|await/.test(trimmedCode)) {
    return 'Python';
  }
  if (/console\.log|function |const |let |var |require\(|module\.exports/.test(trimmedCode)) {
    return 'JavaScript';
  }
  
  return 'desconhecida';
}

/**
 * Valida sintaxe básica do código
 */
export function validateBasicSyntax(code: string, language: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedCode = code.trim();
  
  if (trimmedCode.length < 5) {
    return { isValid: false, error: 'Código muito curto ou vazio' };
  }

  // Validações específicas por linguagem
  switch (language) {
    case 'c':
    case 'cpp':
      // Verificar se tem função main
      if (!/int\s+main\s*\(|void\s+main\s*\(|main\s*\(/.test(trimmedCode)) {
        // Pode ser uma função separada, não rejeitar ainda
      }
      break;
    
    case 'java':
      // Verificar se tem classe e main
      if (!/class\s+\w+/.test(trimmedCode)) {
        return { isValid: false, error: 'Código Java deve conter uma classe' };
      }
      if (!/public\s+static\s+void\s+main\s*\(/.test(trimmedCode)) {
        return { isValid: false, error: 'Código Java deve conter o método main' };
      }
      break;
    
    case 'python':
      // Python é mais flexível, validar apenas sintaxe básica
      break;
    
    case 'javascript':
      // JavaScript é flexível, validar apenas sintaxe básica
      break;
  }

  return { isValid: true };
}

