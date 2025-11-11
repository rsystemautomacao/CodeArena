'use client';

import { FormEvent, useMemo, useState } from 'react';
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
} from 'lucide-react';

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
  const [languagePreview, setLanguagePreview] = useState<'javascript' | 'python' | 'cpp'>(
    'javascript'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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
              <div className="flex space-x-2">
                {(['javascript', 'python', 'cpp'] as const).map((language) => (
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
                    {language === 'javascript' ? 'Node.js' : language === 'python' ? 'Python' : 'C++'}
                  </button>
                ))}
              </div>
              <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-primary-900/90 p-4 text-xs text-primary-50">
                {languageExamples[languagePreview]}
              </pre>
            </div>
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
              <li>• Você testou os casos manualmente antes de salvar?</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando exercício...
              </>
            ) : (
              'Salvar exercício'
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
