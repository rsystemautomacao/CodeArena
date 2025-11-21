'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  role: string;
  profileCompleted?: boolean;
  // Campos específicos para aluno
  enrollment?: string;
  course?: string;
  semester?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    // Campos específicos para aluno
    enrollment: '',
    course: '',
    semester: '',
    avatar: null as File | null
  });

  // Verificar se é primeiro login
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    fetchProfile();
    
    // Verificar se é primeiro login através da URL
    const urlParams = new URLSearchParams(window.location.search);
    setIsFirstLogin(urlParams.get('firstLogin') === 'true');
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          enrollment: profileData.enrollment || '',
          course: profileData.course || '',
          semester: profileData.semester || '',
          avatar: null
        });
        if (profileData.avatar) {
          setAvatarPreview(profileData.avatar);
        }
      } else {
        toast.error('Erro ao carregar perfil');
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        avatar: file
      }));

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    console.log('🔍 ENVIANDO DADOS:', {
      name: formData.name,
      phone: formData.phone,
      bio: formData.bio,
      location: formData.location,
      hasAvatar: !!formData.avatar
    });

    setIsSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('location', formData.location);
      
      // Campos específicos para aluno
      if (session?.user?.role === 'aluno') {
        formDataToSend.append('enrollment', formData.enrollment);
        formDataToSend.append('course', formData.course);
        formDataToSend.append('semester', formData.semester);
        // Marcar perfil como completo se for primeiro login
        if (isFirstLogin) {
          formDataToSend.append('profileCompleted', 'true');
        }
      }
      
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      console.log('🔍 FORM DATA ENVIADO:', {
        name: formDataToSend.get('name'),
        phone: formDataToSend.get('phone'),
        bio: formDataToSend.get('bio'),
        location: formDataToSend.get('location'),
        hasAvatar: !!formDataToSend.get('avatar')
      });

      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formDataToSend,
      });

      console.log('🔍 RESPOSTA DA API:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ ERRO DA API:', errorData);
        throw new Error(errorData.error || 'Erro ao atualizar perfil');
      }

      const updatedProfile = await response.json();
      console.log('✅ PERFIL ATUALIZADO:', updatedProfile);
      
      // Atualizar sessão do NextAuth com os novos dados
      try {
        // CRÍTICO: Não enviar base64 grande no update (causa REQUEST_HEADER_TOO_LARGE)
        const avatarUrl = updatedProfile.avatar || updatedProfile.image || session?.user?.image;
        let imageToUpdate = avatarUrl;
        
        // Se for base64 e muito grande, usar apenas URL ou omitir
        if (avatarUrl && avatarUrl.startsWith('data:image') && avatarUrl.length > 1024) {
          console.log('⚠️ AVATAR É BASE64 GRANDE - USANDO APENAS REFERÊNCIA NA SESSÃO');
          // Usar apenas uma URL de referência ou omitir
          imageToUpdate = undefined; // Não atualizar com base64 grande
        }
        
        await update({
          user: {
            name: updatedProfile.name,
            image: imageToUpdate // Apenas URL ou undefined, nunca base64 grande
          }
        });
        console.log('✅ SESSÃO ATUALIZADA COM SUCESSO');
      } catch (updateError) {
        console.error('⚠️ Erro ao atualizar sessão:', updateError);
        // Recarregar a página para forçar atualização da sessão
        window.location.reload();
      }

      toast.success('Perfil atualizado com sucesso!');
      
      // Se for primeiro login, redirecionar para dashboard
      if (isFirstLogin && updatedProfile.profileCompleted) {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
      
      // Atualizar estado local
      setProfile(updatedProfile);
      
      // Atualizar formData com os dados retornados da API
      // Mantém os valores atuais se o updatedProfile não tiver o campo (usa prev)
      setFormData(prev => ({
        ...prev,
        name: updatedProfile.name || prev.name,
        phone: updatedProfile.phone !== undefined ? updatedProfile.phone : prev.phone,
        bio: updatedProfile.bio !== undefined ? updatedProfile.bio : prev.bio,
        location: updatedProfile.location !== undefined ? updatedProfile.location : prev.location,
        avatar: null // Reset avatar file
      }));
      
      // Atualizar o avatar preview se houver
      if (updatedProfile.avatar) {
        setAvatarPreview(updatedProfile.avatar);
        console.log('🖼️ AVATAR ATUALIZADO:', updatedProfile.avatar);
      }
    } catch (error) {
      console.error('❌ ERRO AO ATUALIZAR PERFIL:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link 
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Link>
              <h1 className="text-2xl font-bold text-blue-600">Meu Perfil</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagem de primeiro login */}
        {isFirstLogin && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Complete seu perfil
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Bem-vindo ao CodeArena! Por favor, complete as informações do seu perfil para continuar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações da Conta */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Conta</h3>
              
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Avatar"
                      width={96}
                      height={96}
                      unoptimized
                      className="h-24 w-24 rounded-full border-4 border-gray-200 object-cover"
                      onError={() => {
                        console.log('❌ ERRO AO CARREGAR IMAGEM:', avatarPreview);
                        setAvatarPreview(null);
                      }}
                    />
                  ) : profile?.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt="Avatar"
                      width={96}
                      height={96}
                      unoptimized
                      className="h-24 w-24 rounded-full border-4 border-gray-200 object-cover"
                      onError={() => {
                        console.log('❌ ERRO AO CARREGAR IMAGEM DO PERFIL:', profile.avatar);
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-200">
                      <span className="text-2xl font-bold text-blue-600">
                        {profile ? getInitials(profile.name) : 'U'}
                      </span>
                    </div>
                  )}
                  
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
                    title="Alterar foto"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Clique na câmera para alterar sua foto
                </p>
              </div>

              {/* Informações não editáveis */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{profile?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Função</p>
                    <p className="text-sm text-gray-900 capitalize">{profile?.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Membro desde</p>
                    <p className="text-sm text-gray-900">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Edição */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Editar Perfil</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
                    placeholder="Seu nome completo"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                {/* Localização */}
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Localização
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
                    placeholder="Cidade, Estado"
                  />
                </div>

                {/* Campos específicos para aluno */}
                {session?.user?.role === 'aluno' && (
                  <>
                    {/* Matrícula */}
                    <div>
                      <label htmlFor="enrollment" className="block text-sm font-semibold text-gray-700 mb-2">
                        Matrícula {isFirstLogin && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        id="enrollment"
                        name="enrollment"
                        value={formData.enrollment}
                        onChange={handleInputChange}
                        required={isFirstLogin}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
                        placeholder="Digite sua matrícula"
                      />
                    </div>

                    {/* Curso */}
                    <div>
                      <label htmlFor="course" className="block text-sm font-semibold text-gray-700 mb-2">
                        Curso {isFirstLogin && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        required={isFirstLogin}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium bg-white"
                      >
                        <option value="">Selecione seu curso</option>
                        <option value="Análise e Desenvolvimento de Sistemas">Análise e Desenvolvimento de Sistemas</option>
                        <option value="Ciência da Computação">Ciência da Computação</option>
                        <option value="Ciência de Dados">Ciência de Dados</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="EM Técnico em TI">EM Técnico em TI</option>
                        <option value="Engenharia de Computação">Engenharia de Computação</option>
                        <option value="Engenharia de Software">Engenharia de Software</option>
                        <option value="Gestão da Tecnologia da Informação">Gestão da Tecnologia da Informação</option>
                        <option value="Inteligência Artificial">Inteligência Artificial</option>
                        <option value="Redes de Computadores">Redes de Computadores</option>
                        <option value="Sistemas de Informação">Sistemas de Informação</option>
                        <option value="Técnico em Informática">Técnico em Informática</option>
                        <option value="Tecnologia em Informática">Tecnologia em Informática</option>
                      </select>
                    </div>

                    {/* Semestre */}
                    <div>
                      <label htmlFor="semester" className="block text-sm font-semibold text-gray-700 mb-2">
                        Semestre {isFirstLogin && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        id="semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        required={isFirstLogin}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium"
                        placeholder="Ex: 3º Semestre"
                      />
                    </div>
                  </>
                )}

                {/* Biografia */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
                    Biografia
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black font-medium resize-none"
                    placeholder="Conte um pouco sobre você, sua experiência, especialidades..."
                  />
                </div>

                {/* Botões */}
                <div className="flex justify-end pt-6 border-t">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
