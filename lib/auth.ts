import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

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
          const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
          
          await mongoose.connect(MONGODB_URI);
          
          const db = mongoose.connection.db;
          if (!db) {
            throw new Error('Não foi possível conectar ao banco de dados');
          }
          
          const usersCollection = db.collection('users');
          const user = await usersCollection.findOne({ 
            email: credentials.email,
            isActive: true 
          });

          if (!user) {
            console.log('❌ USUÁRIO NÃO ENCONTRADO:', credentials.email);
            await mongoose.disconnect();
            return null;
          }

          // Verificar senha
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log('❌ SENHA INCORRETA para:', credentials.email);
            await mongoose.disconnect();
            return null;
          }

          // Verificar se o usuário tem permissão para fazer login
          if (user.role === 'professor') {
            // Verificar se o professor foi criado via convite válido
            const invitesCollection = db.collection('invites');
            const invite = await invitesCollection.findOne({
              email: credentials.email,
              isUsed: true
            });
            
            if (!invite) {
              console.log('❌ PROFESSOR SEM CONVITE VÁLIDO:', credentials.email);
              await mongoose.disconnect();
              return null;
            }
          }

          console.log('✅ LOGIN SUCESSO:', {
            id: user._id,
            email: user.email,
            role: user.role
          });

          await mongoose.disconnect();

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
          const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
          
          await mongoose.connect(MONGODB_URI);
          
          const db = mongoose.connection.db;
          if (!db) {
            throw new Error('Não foi possível conectar ao banco de dados');
          }
          
          const usersCollection = db.collection('users');
          const invitesCollection = db.collection('invites');
          
          // Verificar se o usuário já existe
          const existingUser = await usersCollection.findOne({ email: user.email });
          
          if (existingUser) {
            // Atualizar dados do Google
            await usersCollection.updateOne(
              { _id: existingUser._id },
              { $set: { name: user.name, image: user.image } }
            );
            await mongoose.disconnect();
            return true;
          }

          // Verificar se há um convite pendente para professores
          const invite = await invitesCollection.findOne({ 
            email: user.email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
          });

          if (invite) {
            // Criar usuário como professor
            await usersCollection.insertOne({
              name: user.name!,
              email: user.email!,
              image: user.image,
              role: 'professor',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Marcar convite como usado
            await invitesCollection.updateOne(
              { _id: invite._id },
              { $set: { isUsed: true, usedAt: new Date() } }
            );

            await mongoose.disconnect();
            return true;
          }

          // Para alunos, permitir criação automática
          await usersCollection.insertOne({
            name: user.name!,
            email: user.email!,
            image: user.image,
            role: 'aluno',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          await mongoose.disconnect();
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
