'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  HelpCircle,
  CheckCircle2,
  Play,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import Editor from '@monaco-editor/react';

type TestCase = {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
};

const createEmptyTestCase = (): TestCase => ({
  input: '',
  expectedOutput: '',
  isHidden: false,
});

const difficultyOptions = [
  { value: 'facil', label: 'Fácil' },
  { value: 'medio', label: 'Médio' },
  { value: 'dificil', label: 'Difícil' },
];

const languageExamples: Record<string, string> = {
  javascript: `function solve() {
  const fs = require('fs');
  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  // escreva sua solução aqui
}

solve();`,
  python: `def solve():
    import sys
    data = sys.stdin.read().strip().split()
    # escreva sua solução aqui

if __name__ == "__main__":
    solve()`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // escreva sua solução aqui
    return 0;
}`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // escreva sua solução aqui
        scanner.close();
    }
}`,
  c: `#include <stdio.h>

int main() {
    // escreva sua solução aqui
    return 0;
}`,
};

export default function CreateExercisePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [timeLimit, setTimeLimit] = useState(2);
  const [memoryLimit, setMemoryLimit] = useState(128);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [examples, setExamples] = useState<TestCase[]>([createEmptyTestCase()]);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { ...createEmptyTestCase(), isHidden: true },
  ]);
  const [languagePreview, setLanguagePreview] = useState<'javascript' | 'python' | 'cpp' | 'java' | 'c'>(
    'javascript'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para teste em tempo real
  const [testCode, setTestCode] = useState(languageExamples.python);
  const [testLanguage, setTestLanguage] = useState<'javascript' | 'python' | 'cpp' | 'java' | 'c'>('python');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    testCase: number;
    status: string;
    message: string;
    time?: number;
    memory?: number;
    output?: string;
    expectedOutput?: string;
  }>>([]);
  const [allTestsPassed, setAllTestsPassed] = useState(false);

  const filteredExamples = useMemo(
    () =>
      examples.filter(
        (tc) => tc.input.trim().length > 0 && tc.expectedOutput.trim().length > 0
      ),
    [examples]
  );

  const filteredTestCases = useMemo(
    () =>
      testCases.filter(
        (tc) => tc.input.trim().length > 0 && tc.expectedOutput.trim().length > 0
      ),
    [testCases]
  );

  // Limpar resultados de teste quando os casos de teste mudarem
  useEffect(() => {
    setTestResults([]);
    setAllTestsPassed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput })))]);

  const handleAddTag = () => {
    const sanitized = tagInput.trim();
    if (!sanitized) {
      return;
    }

    if (tags.includes(sanitized.toLowerCase())) {
      toast.error('Essa tag já foi adicionada');
      return;
    }

    setTags((prev) => [...prev, sanitized.toLowerCase()]);
    setTagInput('');
  };

  const removeTag = (value: string) => {
    setTags((prev) => prev.filter((tag) => tag !== value));
  };

const updateTestCase = (
  list: TestCase[],
  setter: Dispatch<SetStateAction<TestCase[]>>,
  index: number,
  field: keyof TestCase,
  value: string | boolean
) => {
    setter(
      list.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

const addNewTestCase = (setter: Dispatch<SetStateAction<TestCase[]>>) => {
  setter((prev) => [...prev, createEmptyTestCase()]);
};

const removeTestCase = (
  list: TestCase[],
  setter: Dispatch<SetStateAction<TestCase[]>>,
  index: number
) => {
    if (list.length === 1) {
      setter([createEmptyTestCase()]);
      return;
    }

    setter(list.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDifficulty('medio');
    setTimeLimit(2);
    setMemoryLimit(128);
    setTags([]);
    setTagInput('');
    setExamples([createEmptyTestCase()]);
    setTestCases([{ ...createEmptyTestCase(), isHidden: true }]);
    setLanguagePreview('javascript');
    setTestCode('');
    setTestLanguage('python');
    setTestResults([]);
    setAllTestsPassed(false);
  };

  const handleTestExercise = async () => {
    if (!testCode.trim()) {
      toast.error('Por favor, escreva algum código antes de testar');
      return;
    }

    if (filteredTestCases.length === 0) {
      toast.error('Cadastre pelo menos um caso de teste antes de testar');
      return;
    }

    setIsTesting(true);
    setTestResults([]);
    setAllTestsPassed(false);

    try {
      const response = await fetch('/api/test-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testCode,
          language: testLanguage,
          testCases: filteredTestCases.map(tc => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
          timeLimit,
          memoryLimit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao testar código');
      }

      if (data.success) {
        setTestResults(data.results || []);
        setAllTestsPassed(data.allPassed || false);
        
        if (data.allPassed) {
          toast.success('Todos os testes passaram! Você pode publicar o exercício.');
        } else {
          toast.error('Alguns testes falharam. Revise seu código antes de publicar.');
        }
      } else {
        throw new Error(data?.error || 'Erro ao testar código');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao testar código');
      setTestResults([]);
      setAllTestsPassed(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Título e descrição são obrigatórios');
      return;
    }

    if (filteredTestCases.length === 0) {
      toast.error('Cadastre pelo menos um caso de teste');
      return;
    }

    // Aviso se não testou, mas permite publicar
    if (testResults.length === 0) {
      const confirmed = window.confirm(
        'Você ainda não testou o código. Deseja publicar mesmo assim? É recomendado testar antes de publicar.'
      );
      if (!confirmed) {
        return;
      }
    } else if (!allTestsPassed) {
      toast.error('Você precisa passar em todos os testes antes de publicar o exercício');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description,
          examples: filteredExamples,
          testCases: filteredTestCases,
          timeLimit,
          memoryLimit,
          difficulty,
          tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível salvar o exercício');
      }

      toast.success('Exercício criado com sucesso!');
      resetForm();
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao criar exercício');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Novo exercício</h1>
            <p className="mt-1 text-gray-600">
              Modele desafios no estilo URI / Beecrowd com casos de teste automáticos integrados ao
              Judge0.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:text-primary-600"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.35fr_0.9fr]"
      >
        <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <header className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">Detalhes do problema</h2>
            <p className="text-sm text-gray-500">
              Descreva o enunciado, restrições e exemplos de entrada/saída que serão exibidos aos
              alunos.
            </p>
          </header>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título
            </label>
            <input
              id="title"
              type="text"
              placeholder="Ex.: Soma Simples, Par ou Ímpar..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descrição / Enunciado
            </label>
            <textarea
              id="description"
              rows={9}
              placeholder={`Contextualize o problema, apresente o que deve ser calculado e defina as restrições.

Sugestão: utilize Markdown básico para separar seções, listas e destacar trechos de código.`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                Dificuldade
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as any)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                Limite de tempo (s)
              </label>
              <input
                id="timeLimit"
                type="number"
                min={1}
                max={15}
                value={timeLimit}
                onChange={(event) => setTimeLimit(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="memoryLimit" className="block text-sm font-medium text-gray-700">
                Limite de memória (MB)
              </label>
              <input
                id="memoryLimit"
                type="number"
                min={32}
                max={1024}
                step={32}
                value={memoryLimit}
                onChange={(event) => setMemoryLimit(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="inline-flex items-center space-x-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-200"
                >
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Adicione tags como 'strings', 'dfs', 'matematica'"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex items-center rounded-lg border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-600 hover:text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar tag
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Exemplos públicos</h3>
                <p className="text-sm text-gray-500">
                  Os exemplos aparecem no enunciado para que os alunos entendam o formato de entrada
                  e saída.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addNewTestCase(setExamples)}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo exemplo
              </button>
            </header>

            <div className="space-y-4">
              {examples.map((example, index) => (
                <div
                  key={`example-${index}`}
                  className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 transition hover:border-primary-200"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Exemplo #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTestCase(examples, setExamples, index)}
                      className="rounded-md border border-transparent p-1 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Entrada</label>
                      <textarea
                        rows={3}
                        value={example.input}
                        onChange={(event) =>
                          updateTestCase(examples, setExamples, index, 'input', event.target.value)
                        }
                        placeholder="Ex.: 10\n20"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Saída esperada</label>
                      <textarea
                        rows={3}
                        value={example.expectedOutput}
                        onChange={(event) =>
                          updateTestCase(
                            examples,
                            setExamples,
                            index,
                            'expectedOutput',
                            event.target.value
                          )
                        }
                        placeholder="Ex.: 30"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Casos de teste</h3>
                <p className="text-sm text-gray-500">
                  São utilizados pelo Judge0 para validar a submissão do aluno. Você pode ocultar
                  test cases para evitar que os alunos descubram a lógica apenas pelos exemplos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addNewTestCase(setTestCases)}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo caso
              </button>
            </header>

            <div className="space-y-4">
              {testCases.map((testCase, index) => (
                <div
                  key={`test-${index}`}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary-200"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {testCase.isHidden ? (
                        <span className="inline-flex items-center rounded-full bg-gray-800/90 px-3 py-1 text-xs font-medium text-gray-100">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Oculto
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          <Eye className="mr-1 h-3 w-3" />
                          Visível
                        </span>
                      )}
                      <span className="text-sm font-semibold text-gray-700">
                        Caso #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateTestCase(
                            testCases,
                            setTestCases,
                            index,
                            'isHidden',
                            !testCase.isHidden
                          )
                        }
                        className="rounded-md border border-gray-200 p-1.5 text-gray-500 transition hover:border-primary-200 hover:text-primary-600"
                        title={testCase.isHidden ? 'Tornar visível aos alunos' : 'Ocultar dos alunos'}
                      >
                        {testCase.isHidden ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTestCase(testCases, setTestCases, index)}
                        className="rounded-md border border-transparent p-1.5 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Entrada</label>
                      <textarea
                        rows={4}
                        value={testCase.input}
                        onChange={(event) =>
                          updateTestCase(testCases, setTestCases, index, 'input', event.target.value)
                        }
                        placeholder="Dados que serão fornecidos ao programa"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Saída esperada
                      </label>
                      <textarea
                        rows={4}
                        value={testCase.expectedOutput}
                        onChange={(event) =>
                          updateTestCase(
                            testCases,
                            setTestCases,
                            index,
                            'expectedOutput',
                            event.target.value
                          )
                        }
                        placeholder="Resposta correta produzida pelo programa"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-primary-50 p-5 text-sm text-primary-800">
            <div className="flex items-center space-x-2 font-semibold text-primary-900">
              <HelpCircle className="h-4 w-4" />
              <span>Formato da solução</span>
            </div>
            <p className="mt-3">
              Os alunos devem escrever funções que leem toda a entrada da <code>stdin</code> e
              imprimem a resposta na <code>stdout</code>. Abaixo há um template base para cada
              linguagem suportada.
            </p>

            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {(['javascript', 'python', 'cpp', 'java', 'c'] as const).map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setLanguagePreview(language)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                      languagePreview === language
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    }`}
                  >
                    {language === 'javascript' ? 'Node.js' 
                      : language === 'python' ? 'Python' 
                      : language === 'cpp' ? 'C++'
                      : language === 'java' ? 'Java'
                      : 'C'}
                  </button>
                ))}
              </div>
              <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-primary-900/90 p-4 text-xs text-primary-50">
                {languageExamples[languagePreview]}
              </pre>
            </div>
          </div>

          {/* Seção de Teste em Tempo Real */}
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Teste em Tempo Real</h3>
                <p className="text-sm text-gray-500">
                  Teste seu código contra todos os casos de teste antes de publicar
                </p>
              </div>
              {allTestsPassed && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Todos os testes passaram</span>
                </div>
              )}
            </div>

            {/* Seletor de Linguagem */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Linguagem:</label>
              <select
                value={testLanguage}
                onChange={(e) => {
                  setTestLanguage(e.target.value as any);
                  setTestCode(languageExamples[e.target.value] || '');
                }}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="javascript">JavaScript (Node.js)</option>
              </select>
            </div>

            {/* Editor de Código */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="h-64">
                <Editor
                  height="100%"
                  language={testLanguage === 'javascript' ? 'javascript' : testLanguage === 'cpp' ? 'cpp' : testLanguage === 'java' ? 'java' : testLanguage === 'c' ? 'c' : 'python'}
                  value={testCode}
                  onChange={(value) => setTestCode(value || '')}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </div>

            {/* Botão de Teste */}
            <button
              type="button"
              onClick={handleTestExercise}
              disabled={isTesting || filteredTestCases.length === 0}
              className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Testar contra todos os casos de teste
                </>
              )}
            </button>

            {/* Resultados dos Testes */}
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">Resultados dos Testes:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${
                        result.status === 'accepted'
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {result.status === 'accepted' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            Caso de Teste #{result.testCase}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            result.status === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.status === 'accepted' ? 'Aceito' : result.message}
                        </span>
                      </div>
                      {result.status !== 'accepted' && (
                        <div className="mt-2 space-y-1 text-xs">
                          <div>
                            <span className="font-medium text-gray-700">Esperado: </span>
                            <span className="font-mono text-gray-900">{result.expectedOutput}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Obtido: </span>
                            <span className="font-mono text-gray-900">
                              {result.output || 'Nenhuma saída'}
                            </span>
                          </div>
                        </div>
                      )}
                      {result.time !== undefined && (
                        <div className="mt-1 text-xs text-gray-600">
                          Tempo: {result.time.toFixed(3)}s
                          {result.memory !== undefined && ` • Memória: ${result.memory} KB`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-700">
            <div className="flex items-center space-x-2 font-semibold text-gray-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Checklist rápido</span>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li>• O enunciado descreve claramente a entrada e a saída?</li>
              <li>• Há pelo menos um caso de teste público e outro oculto?</li>
              <li>• Os limites de tempo/memória são coerentes com a dificuldade?</li>
              <li>• Você testou o código e todos os testes passaram?</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!allTestsPassed && testResults.length > 0)}
            className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando exercício...
              </>
            ) : !allTestsPassed && testResults.length > 0 ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Corrija os testes antes de publicar
              </>
            ) : testResults.length === 0 ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Publicar sem testar (não recomendado)
              </>
            ) : (
              'Publicar exercício'
            )}
          </button>

          <p className="text-xs text-gray-500">
            Ao salvar, o exercício ficará disponível para ser utilizado em atividades e provas. Você
            poderá editá-lo ou desativá-lo a qualquer momento através do painel do professor.
          </p>
        </aside>
      </form>
    </div>
  );
}
