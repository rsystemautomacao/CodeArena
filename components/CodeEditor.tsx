'use client';

import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, RotateCcw, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CodeEditorProps {
  exerciseId?: string;
  initialCode?: string;
  language?: string;
  onCodeChange?: (code: string) => void;
  onSubmit?: (code: string, language: string) => void;
  readOnly?: boolean;
}

const LANGUAGE_TEMPLATES = {
  python: `# Escreva seu código Python aqui`,
  
  java: `// Escreva seu código Java aqui`,
  
  c: `// Escreva seu código C aqui`,
  
  cpp: `// Escreva seu código C++ aqui`,
  
  javascript: `// Escreva seu código JavaScript aqui`
};

export default function CodeEditor({
  exerciseId,
  initialCode = '',
  language = 'python',
  onCodeChange,
  onSubmit,
  readOnly = false
}: CodeEditorProps) {
  // Para alunos, sempre começar com template vazio (sem código funcional pré-preenchido)
  // Sempre usar apenas o template básico, ignorando qualquer código inicial fornecido
  const [code, setCode] = useState(LANGUAGE_TEMPLATES[language as keyof typeof LANGUAGE_TEMPLATES] || '');
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    // Sempre usar template básico quando mudar linguagem
    setCode(LANGUAGE_TEMPLATES[newLanguage as keyof typeof LANGUAGE_TEMPLATES] || '');
  };

  const handleTestCode = async () => {
    if (!code.trim()) {
      toast.error('Por favor, escreva algum código antes de testar');
      return;
    }

    setIsRunning(true);
    setTestOutput('');

    try {
      const response = await fetch('/api/test-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: selectedLanguage,
          input: testInput,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestOutput(data.result.output || 'Nenhuma saída');
      } else {
        setTestOutput(`Erro: ${data.error}`);
      }
    } catch (error) {
      setTestOutput('Erro ao executar código');
      toast.error('Erro ao testar código');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      toast.error('Por favor, escreva algum código antes de submeter');
      return;
    }

    // Validar que o código não está apenas com template
    const trimmedCode = code.trim();
    const currentTemplate = LANGUAGE_TEMPLATES[selectedLanguage as keyof typeof LANGUAGE_TEMPLATES];
    if (trimmedCode === currentTemplate || trimmedCode.length < 10) {
      toast.error('Por favor, escreva um código válido antes de submeter. O código não pode estar vazio ou apenas com comentários.');
      return;
    }

    if (!exerciseId) {
      toast.error('ID do exercício não encontrado');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
          code,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();

      // Verificar se a resposta HTTP indica erro
      if (!response.ok) {
        toast.error(data.error || 'Erro ao submeter código');
        return;
      }

      // Verificar se o status da submissão é aceito
      if (data.success && data.status === 'accepted') {
        toast.success('Código submetido com sucesso!');
        onSubmit?.(code, selectedLanguage);
      } else {
        // Se não foi aceito, mostrar erro específico
        let errorMessage = data.error || data.message || 'Erro ao submeter código';
        
        // Se for erro de compilação, mostrar mensagem detalhada
        if (data.status === 'compilation_error') {
          errorMessage = `Erro de compilação: ${data.message || errorMessage}`;
          if (data.testResults && data.testResults[0]?.output) {
            errorMessage += `\n${data.testResults[0].output}`;
          }
        } else if (data.status === 'wrong_answer') {
          errorMessage = `Resposta incorreta: ${data.message || errorMessage}`;
        } else if (data.status === 'runtime_error') {
          errorMessage = `Erro de execução: ${data.message || errorMessage}`;
        }
        
        toast.error(errorMessage, { duration: 5000 });
      }
    } catch (error) {
      toast.error('Erro ao submeter código');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCode = () => {
    setCode(LANGUAGE_TEMPLATES[selectedLanguage as keyof typeof LANGUAGE_TEMPLATES] || '');
    setTestInput('');
    setTestOutput('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={readOnly}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            style={{ color: '#111827' }}
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="javascript">JavaScript</option>
          </select>
          
          {!readOnly && (
            <button
              onClick={resetCode}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              title="Resetar código"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Resetar
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!readOnly && (
            <>
              <button
                onClick={handleTestCode}
                disabled={isRunning}
                className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="w-4 h-4 mr-1" />
                {isRunning ? 'Testando...' : 'Testar'}
              </button>
              
              {exerciseId && (
                <button
                  onClick={handleSubmitCode}
                  disabled={isSubmitting}
                  className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Submetendo...' : 'Submeter'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="h-96">
        <Editor
          height="100%"
          language={selectedLanguage}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            colorDecorators: true,
            cursorBlinking: 'smooth',
          }}
          theme="vs-dark"
        />
      </div>

      {/* Test Section */}
      {!readOnly && (
        <div className="border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Entrada de Teste
              </label>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white"
                placeholder="Digite a entrada para testar seu código..."
                style={{ color: '#111827' }}
              />
            </div>

            {/* Output */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Saída
              </label>
              <div className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm overflow-auto text-gray-900">
                {testOutput || <span className="text-gray-500">A saída aparecerá aqui...</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
