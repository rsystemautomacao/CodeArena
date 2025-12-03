'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Globe,
  Users,
  AlertCircle
} from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface AccessControlData {
  assignment: {
    _id: string;
    title: string;
    type: string;
    enabledStudents: Student[];
    requireLabIP: boolean;
    allowedIPRanges: string[];
  };
  classroomStudents: Student[];
}

export default function AccessControlPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<AccessControlData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados do formulário
  const [enabledStudentIds, setEnabledStudentIds] = useState<string[]>([]);
  const [requireLabIP, setRequireLabIP] = useState(false);
  const [ipRanges, setIpRanges] = useState<string[]>(['']);
  const [newIPRange, setNewIPRange] = useState('');

  useEffect(() => {
    if (id && session?.user?.role === 'professor') {
      fetchData();
    } else if (session?.user?.role !== 'professor') {
      router.push('/dashboard/assignments');
    }
  }, [id, session]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/assignments/${id}/access-control`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }

      const responseData = await response.json();
      setData(responseData);
      
      // Inicializar estados
      setEnabledStudentIds(
        responseData.assignment.enabledStudents.map((s: Student) => s._id)
      );
      setRequireLabIP(responseData.assignment.requireLabIP || false);
      setIpRanges(
        responseData.assignment.allowedIPRanges.length > 0
          ? responseData.assignment.allowedIPRanges
          : ['']
      );
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast.error(error?.message || 'Erro ao carregar configurações');
      router.push(`/dashboard/assignments/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setEnabledStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleAddIPRange = () => {
    if (newIPRange.trim()) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      if (ipRegex.test(newIPRange.trim())) {
        setIpRanges(prev => [...prev, newIPRange.trim()]);
        setNewIPRange('');
      } else {
        toast.error('Formato de IP inválido. Use formato: 192.168.1.0/24 ou 192.168.1.100');
      }
    }
  };

  const handleRemoveIPRange = (index: number) => {
    setIpRanges(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const validIPRanges = ipRanges.filter(ip => ip.trim() !== '');
      
      const response = await fetch(`/api/assignments/${id}/access-control`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabledStudents: enabledStudentIds,
          requireLabIP: requireLabIP,
          allowedIPRanges: validIPRanges,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar configurações');
      }

      toast.success('Configurações salvas com sucesso!');
      router.push(`/dashboard/assignments/${id}`);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error?.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary-500" />
          <p className="mt-3 text-sm text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Verificar se é uma prova
  if (data.assignment.type !== 'prova') {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader title="Controle de Acesso" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              O controle de acesso está disponível apenas para provas.
            </p>
          </div>
          <Link
            href={`/dashboard/assignments/${id}`}
            className="mt-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title={`Controle de Acesso - ${data.assignment.title}`} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/dashboard/assignments/${id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para atividade
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Habilitação Manual de Alunos */}
          <div>
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Habilitação Manual de Alunos
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Selecione os alunos que podem acessar esta prova. Se nenhum aluno for selecionado, todos os alunos da turma terão acesso.
            </p>
            
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {data.classroomStudents.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  Nenhum aluno na turma
                </p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {data.classroomStudents.map((student) => {
                    const isEnabled = enabledStudentIds.includes(student._id);
                    return (
                      <label
                        key={student._id}
                        className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleToggleStudent(student._id)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                        {isEnabled ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Validação de IP do Laboratório */}
          <div>
            <div className="flex items-center mb-4">
              <Globe className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Validação de IP do Laboratório
              </h2>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={requireLabIP}
                  onChange={(e) => setRequireLabIP(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Exigir que alunos estejam na rede do laboratório
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Se ativado, apenas alunos conectados à rede do laboratório poderão acessar a prova
              </p>
            </div>

            {requireLabIP && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faixas de IP Permitidas
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Adicione faixas de IP ou IPs específicos da rede do laboratório (formato: 192.168.1.0/24 ou 192.168.1.100)
                </p>
                
                <div className="space-y-2 mb-3">
                  {ipRanges.map((range, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={range}
                        onChange={(e) => {
                          const newRanges = [...ipRanges];
                          newRanges[index] = e.target.value;
                          setIpRanges(newRanges);
                        }}
                        placeholder="192.168.1.0/24"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                      />
                      <button
                        onClick={() => handleRemoveIPRange(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newIPRange}
                    onChange={(e) => setNewIPRange(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIPRange();
                      }
                    }}
                    placeholder="192.168.1.0/24"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={handleAddIPRange}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Avisos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Se nenhum aluno for selecionado, todos terão acesso (se o IP for válido)</li>
                  <li>Se a validação de IP estiver ativa, alunos fora da rede do laboratório não poderão acessar</li>
                  <li>As configurações são aplicadas imediatamente após salvar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <Link
              href={`/dashboard/assignments/${id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

