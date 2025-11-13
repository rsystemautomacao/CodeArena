'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Save, Plus, X, User, Mail, Phone, MapPin, Home, BookOpen, FileText } from 'lucide-react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  address?: string;
  subjects?: string[];
  avatar?: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile');

      if (!response.ok) {
        throw new Error('Erro ao carregar perfil');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('phone', profile.phone || '');
      formData.append('bio', profile.bio || '');
      formData.append('location', profile.location || '');
      formData.append('address', profile.address || '');
      formData.append('subjects', JSON.stringify(profile.subjects || []));

      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Erro ao salvar configurações');
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const addSubject = () => {
    if (!newSubject.trim() || !profile) return;
    
    const trimmed = newSubject.trim();
    if (profile.subjects?.includes(trimmed)) {
      toast.error('Esta matéria já foi adicionada');
      return;
    }

    setProfile({
      ...profile,
      subjects: [...(profile.subjects || []), trimmed],
    });
    setNewSubject('');
  };

  const removeSubject = (subject: string) => {
    if (!profile) return;
    setProfile({
      ...profile,
      subjects: profile.subjects?.filter((s) => s !== subject) || [],
    });
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Erro ao carregar perfil</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">Configurações</h1>
            <p className="mt-1 text-gray-600">
              Gerencie suas informações pessoais e acadêmicas
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <User className="mr-2 h-5 w-5 text-primary-600" />
              Informações Básicas
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  <Mail className="mr-1 inline h-4 w-4" />
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  value={profile.email}
                  disabled
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">O e-mail não pode ser alterado</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  <Phone className="mr-1 inline h-4 w-4" />
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Informações de Localização */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <MapPin className="mr-2 h-5 w-5 text-primary-600" />
              Localização
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Cidade/Estado
                </label>
                <input
                  type="text"
                  id="location"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Ex: São Paulo, SP"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  <Home className="mr-1 inline h-4 w-4" />
                  Endereço
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Rua, número, bairro, complemento..."
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Matérias/Disciplinas */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <BookOpen className="mr-2 h-5 w-5 text-primary-600" />
              Matérias/Disciplinas
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubject();
                    }
                  }}
                  placeholder="Digite o nome da matéria"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={addSubject}
                  className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </button>
              </div>

              {profile.subjects && profile.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700"
                    >
                      {subject}
                      <button
                        type="button"
                        onClick={() => removeSubject(subject)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma matéria adicionada ainda</p>
              )}
            </div>
          </div>

          {/* Biografia */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <FileText className="mr-2 h-5 w-5 text-primary-600" />
              Biografia
            </h2>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Sobre você
              </label>
              <textarea
                id="bio"
                rows={5}
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Conte um pouco sobre sua experiência, formação, áreas de interesse..."
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-400"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

