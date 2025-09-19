'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  UserPlus, 
  Mail, 
  LogOut, 
  BarChart3,
  Settings,
  Copy,
  RefreshCw,
  Pause,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface Invite {
  id: string;
  email: string;
  token: string;
  inviteUrl: string;
  createdAt: string;
  isUsed: boolean;
  isActive: boolean;
}

export default function SuperAdminDashboard() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showInviteUrl, setShowInviteUrl] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    onConfirm: () => {}
  });

  // Carregar convites existentes (simulado para desenvolvimento)
  useEffect(() => {
    // Em desenvolvimento, simular alguns convites
    if (process.env.NODE_ENV === 'development') {
      setInvites([
        {
          id: '1',
          email: 'professor1@exemplo.com',
          token: 'token1',
          inviteUrl: 'http://localhost:3000/auth/invite/token1',
          createdAt: new Date().toISOString(),
          isUsed: false,
          isActive: true
        },
        {
          id: '2',
          email: 'professor2@exemplo.com',
          token: 'token2',
          inviteUrl: 'http://localhost:3000/auth/invite/token2',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
          isUsed: true,
          isActive: true
        }
      ]);
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const showConfirmModal = (
    title: string,
    message: string,
    type: 'danger' | 'warning' | 'info' | 'success',
    onConfirm: () => void
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleInviteTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Por favor, insira um email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Convite criado com sucesso!');
        
        // Adicionar novo convite à lista
        const newInvite: Invite = {
          id: Date.now().toString(),
          email: email,
          token: data.inviteUrl.split('/').pop() || '',
          inviteUrl: data.inviteUrl,
          createdAt: new Date().toISOString(),
          isUsed: false,
          isActive: true
        };
        
        setInvites(prev => [newInvite, ...prev]);
        setShowInviteUrl(data.inviteUrl);
        setEmail('');
      } else {
        toast.error(data.error || 'Erro ao enviar convite');
      }
    } catch (error) {
      toast.error('Erro ao enviar convite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (inviteId: string) => {
    const invite = invites.find(inv => inv.id === inviteId);
    if (!invite) return;

    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: invite.email }),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar o convite na lista
        setInvites(prev => prev.map(inv => 
          inv.id === inviteId 
            ? { ...inv, token: data.inviteUrl.split('/').pop() || '', inviteUrl: data.inviteUrl, isUsed: false }
            : inv
        ));
        setShowInviteUrl(data.inviteUrl);
        toast.success('Novo link de convite gerado!');
      } else {
        toast.error(data.error || 'Erro ao gerar novo convite');
      }
    } catch (error) {
      toast.error('Erro ao gerar novo convite');
    }
  };

  const handlePauseAccess = (inviteId: string) => {
    const invite = invites.find(inv => inv.id === inviteId);
    if (!invite) return;

    const action = invite.isActive ? 'pausar' : 'ativar';
    const actionPast = invite.isActive ? 'pausado' : 'ativado';
    
    showConfirmModal(
      `${action === 'pausar' ? 'Pausar' : 'Ativar'} Acesso`,
      `Tem certeza que deseja ${action} o acesso do convite para ${invite.email}?`,
      'warning',
      () => {
        setInvites(prev => prev.map(inv => 
          inv.id === inviteId 
            ? { ...inv, isActive: !inv.isActive }
            : inv
        ));
        toast.success(`Acesso ${actionPast} com sucesso!`);
      }
    );
  };

  const handleDeleteAccess = (inviteId: string) => {
    const invite = invites.find(inv => inv.id === inviteId);
    if (!invite) return;

    showConfirmModal(
      'Excluir Convite',
      `Tem certeza que deseja excluir permanentemente o convite para ${invite.email}? Esta ação não pode ser desfeita.`,
      'danger',
      () => {
        setInvites(prev => prev.filter(inv => inv.id !== inviteId));
        toast.success('Convite excluído com sucesso!');
      }
    );
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-500">CodeArena</h1>
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                Super Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Olá, <span className="font-medium">{session?.user?.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel de Super Administrador
          </h1>
          <p className="text-gray-600">
            Gerencie professores e monitore o sistema CodeArena
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-primary-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Convites</p>
                <p className="text-2xl font-bold text-gray-900">{invites.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <UserPlus className="w-6 h-6 text-success-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Convites Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{invites.filter(inv => inv.isActive && !inv.isUsed).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Convites Usados</p>
                <p className="text-2xl font-bold text-gray-900">{invites.filter(inv => inv.isUsed).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Teacher Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Mail className="w-5 h-5 text-primary-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Convidar Professor
            </h2>
          </div>
          
          <form onSubmit={handleInviteTeacher} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email do Professor
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="professor@exemplo.com"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Enviando...' : 'Enviar Convite'}
            </button>
          </form>
          
          {/* Link do Convite */}
          {showInviteUrl && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Link do convite gerado:
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={showInviteUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-md text-sm font-mono text-gray-900"
                    />
                    <button
                      onClick={() => copyToClipboard(showInviteUrl)}
                      className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteUrl(null)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Como funciona:</strong> O professor receberá um link único que expira em 24 horas. 
              Ele poderá ativar sua conta fazendo login com Google usando o email convidado.
            </p>
          </div>
        </div>

        {/* Lista de Convites */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-primary-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Convites Enviados ({invites.length})
            </h2>
          </div>
          
          {invites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum convite enviado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div key={invite.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium text-gray-900">{invite.email}</p>
                          <p className="text-sm text-gray-500">
                            Criado em: {new Date(invite.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invite.isUsed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invite.isUsed ? 'Usado' : 'Pendente'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invite.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {invite.isActive ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(invite.inviteUrl)}
                        className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                        title="Copiar link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleResetPassword(invite.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Gerar novo link"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handlePauseAccess(invite.id)}
                        className={`p-2 transition-colors ${
                          invite.isActive 
                            ? 'text-gray-600 hover:text-yellow-600' 
                            : 'text-yellow-600 hover:text-gray-600'
                        }`}
                        title={invite.isActive ? 'Pausar acesso' : 'Ativar acesso'}
                      >
                        {invite.isActive ? <Pause className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAccess(invite.id)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Excluir convite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-primary-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Informações do Sistema
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Versão</p>
              <p className="text-lg text-gray-900">1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-lg text-green-600">Online</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Ambiente</p>
              <p className="text-lg text-blue-600">Desenvolvimento</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Banco de Dados</p>
              <p className="text-lg text-yellow-600">Simulado</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Judge0 API</p>
              <p className="text-lg text-yellow-600">Simulado</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Google OAuth</p>
              <p className="text-lg text-yellow-600">Simulado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
}
