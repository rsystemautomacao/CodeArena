'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import DashboardHeader from '@/components/DashboardHeader';
import { 
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Code,
  Calendar,
  Trophy,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface Submission {
  _id: string;
  exercise: {
    _id: string;
    title: string;
  };
  assignment?: {
    _id: string;
    title: string;
  };
  status: string;
  language: string;
  submittedAt: string;
  result?: {
    status: string;
    message: string;
    testCases?: {
      passed: number;
      total: number;
    };
    time?: number;
    memory?: number;
  };
  code?: string;
}

export default function SubmissionsPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/submissions?page=${page}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar submissões');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Erro ao buscar submissões:', error);
      toast.error('Erro ao carregar submissões');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'wrong_answer':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'time_limit_exceeded':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'runtime_error':
        return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'compilation_error':
        return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'pending':
        return 'text-gray-600 bg-gray-100 border-gray-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Aceito';
      case 'wrong_answer':
        return 'Resposta Incorreta';
      case 'time_limit_exceeded':
        return 'Tempo Excedido';
      case 'runtime_error':
        return 'Erro de Execução';
      case 'compilation_error':
        return 'Erro de Compilação';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'wrong_answer':
      case 'runtime_error':
      case 'compilation_error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'time_limit_exceeded':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getLanguageName = (language: string) => {
    const languages: { [key: string]: string } = {
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
    };
    return languages[language] || language;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando submissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="Minhas Submissões" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Aceitos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total de Submissões</p>
                <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Code className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.length > 0 
                    ? Math.round((submissions.filter(s => s.status === 'accepted').length / submissions.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Histórico de Submissões</h2>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma submissão encontrada</p>
              <p className="text-sm text-gray-500">
                Comece resolvendo exercícios para ver seu histórico de submissões
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(submission.status)}
                        <Link
                          href={`/dashboard/exercise/${submission.exercise._id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {submission.exercise.title}
                        </Link>
                      </div>
                      
                      {submission.assignment && (
                        <p className="text-sm text-gray-600 mb-2">
                          Atividade: <span className="font-medium">{submission.assignment.title}</span>
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Code className="w-4 h-4 mr-1" />
                          {getLanguageName(submission.language)}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(submission.submittedAt).toLocaleString('pt-BR')}
                        </div>
                        {submission.result?.testCases && (
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-1" />
                            {submission.result.testCases.passed}/{submission.result.testCases.total} testes
                          </div>
                        )}
                      </div>

                      {submission.result?.message && (
                        <p className="text-sm text-gray-600 mt-2">{submission.result.message}</p>
                      )}
                    </div>

                    <div className="ml-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          submission.status
                        )}`}
                      >
                        {getStatusText(submission.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para ver código */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedSubmission.exercise.title}
              </h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Code className="w-4 h-4 mr-1" />
                    {getLanguageName(selectedSubmission.language)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(selectedSubmission.submittedAt).toLocaleString('pt-BR')}
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      selectedSubmission.status
                    )}`}
                  >
                    {getStatusText(selectedSubmission.status)}
                  </span>
                </div>
              </div>
              
              {selectedSubmission.code && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Código Submetido:</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{selectedSubmission.code}</code>
                  </pre>
                </div>
              )}

              {selectedSubmission.result && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Resultado:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedSubmission.result.testCases && (
                      <p className="text-sm text-gray-700 mb-2">
                        Testes passados: {selectedSubmission.result.testCases.passed}/{selectedSubmission.result.testCases.total}
                      </p>
                    )}
                    {selectedSubmission.result.message && (
                      <p className="text-sm text-gray-700">{selectedSubmission.result.message}</p>
                    )}
                    {selectedSubmission.result.time && (
                      <p className="text-sm text-gray-600 mt-2">
                        Tempo: {selectedSubmission.result.time}ms
                      </p>
                    )}
                    {selectedSubmission.result.memory && (
                      <p className="text-sm text-gray-600">
                        Memória: {selectedSubmission.result.memory}KB
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

