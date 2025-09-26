import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from './mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    // Google Provider - só funciona se as credenciais estiverem configuradas
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
        process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') ? 
        [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        })] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 CREDENTIALS LOGIN:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
          superadminEmail: process.env.SUPERADMIN_EMAIL,
          superadminPassword: process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO'
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ CREDENTIALS VAZIAS');
          return null;
        }

        // CONECTAR AO BANCO DE DADOS E VERIFICAR USUÁRIO
        console.log('🔐 TENTATIVA DE LOGIN:', {
          email: credentials.email,
          timestamp: new Date().toISOString()
        });

        // Em modo de desenvolvimento, permitir login com qualquer email/senha
        if (process.env.NODE_ENV === 'development') {
          // Verificar se é um email de professor (criado via convite)
          const { getDevInviteTokens } = await import('@/lib/invite');
          const devInvites = getDevInviteTokens();
          const isProfessorEmail = devInvites.some(invite => 
            invite.email === credentials.email.toLowerCase() && invite.isUsed
          );
          
          if (isProfessorEmail) {
            return {
              id: `professor-${credentials.email}`,
              name: `Professor ${credentials.email.split('@')[0]}`,
              email: credentials.email,
              role: 'professor',
            };
          }
          
          // Simular diferentes tipos de usuário baseado no email
          if (credentials.email.includes('professor') || credentials.email.includes('teacher')) {
            return {
              id: 'professor-dev',
              name: 'Professor de Desenvolvimento',
              email: credentials.email,
              role: 'professor',
            };
          }
          
          return {
            id: 'aluno-dev',
            name: 'Aluno de Desenvolvimento',
            email: credentials.email,
            role: 'aluno',
          };
        }

        // CONECTAR AO BANCO E VERIFICAR USUÁRIO
        try {
          await connectDB();
          
          const user = await User.findOne({ 
            email: credentials.email,
            isActive: true 
          });

          if (!user) {
            console.log('❌ USUÁRIO NÃO ENCONTRADO:', credentials.email);
            return null;
          }

          // Verificar senha
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log('❌ SENHA INCORRETA para:', credentials.email);
            return null;
          }

          // Verificar se o usuário tem permissão para fazer login
          if (user.role === 'professor') {
            // Verificar se o professor foi criado via convite válido
            const Invite = (await import('@/models/Invite')).default;
            const invite = await Invite.findOne({
              email: credentials.email,
              isUsed: true
            });
            
            if (!invite) {
              console.log('❌ PROFESSOR SEM CONVITE VÁLIDO:', credentials.email);
              return null;
            }
          }

          console.log('✅ LOGIN SUCESSO:', {
            id: user._id,
            email: user.email,
            role: user.role
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error('❌ ERRO DE CONEXÃO COM BANCO:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🚪 SIGNIN CALLBACK:', {
        provider: account?.provider,
        userEmail: user?.email,
        userName: user?.name,
        userRole: user?.role,
        environment: process.env.NODE_ENV
      });

      // Se for superadmin, permitir login sempre
      if (user?.role === 'superadmin') {
        console.log('✅ SUPERADMIN DETECTADO - PERMITINDO LOGIN');
        return true;
      }

      // Em desenvolvimento, permitir qualquer login
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ DEVELOPMENT MODE - PERMITINDO LOGIN');
        return true;
      }

      // Em produção, processar Google OAuth
      if (account?.provider === 'google') {
        console.log('🔍 GOOGLE OAUTH PROCESSING:', {
          userEmail: user?.email,
          hasUser: !!user,
          hasProfile: !!profile
        });
        try {
          await connectDB();
          
          // Verificar se o usuário já existe
          const existingUser = await User.findOne({ email: user.email });
          
          if (existingUser) {
            // Atualizar dados do Google
            await User.findByIdAndUpdate(existingUser._id, {
              name: user.name,
              image: user.image,
            });
            return true;
          }

          // Verificar se há um convite pendente para professores
          const Invite = (await import('@/models/Invite')).default;
          const invite = await Invite.findOne({ 
            email: user.email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
          });

          if (invite) {
            // Criar usuário como professor
            await User.create({
              name: user.name!,
              email: user.email!,
              image: user.image,
              role: 'professor',
              isActive: true,
            });

            // Marcar convite como usado
            await Invite.findByIdAndUpdate(invite._id, {
              isUsed: true,
              usedAt: new Date(),
            });

            return true;
          }

          // Para alunos, permitir criação automática
          await User.create({
            name: user.name!,
            email: user.email!,
            image: user.image,
            role: 'aluno',
            isActive: true,
          });

          return true;
        } catch (error) {
          console.error('Erro no Google OAuth:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
