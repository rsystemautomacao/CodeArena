import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './mongodb';
import User from '@/models/User';
import { invalidateUserSessions } from './session-manager';


export const authOptions: NextAuthOptions = {
  providers: [
    // Google Provider - sempre incluir, NextAuth vai lidar com as credenciais
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Bypass de autenticação APENAS para desenvolvimento local explicitamente habilitado.
        // Requer DEV_AUTH_BYPASS=true no .env.local — NUNCA definir isso em produção.
        if (
          process.env.NODE_ENV === 'development' &&
          process.env.DEV_AUTH_BYPASS === 'true'
        ) {
          console.warn('⚠️ DEV_AUTH_BYPASS ativo — nunca habilite isso em produção!');
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
        // (Superadmin é verificado via bcrypt junto com os demais usuários)
        try {
          // Usar o pool de conexões centralizado (nunca desconectar manualmente)
          await connectDB();

          const db = mongoose.connection.db;
          if (!db) {
            throw new Error('Não foi possível conectar ao banco de dados');
          }

          const usersCollection = db.collection('users');

          // VERIFICAR SE É SUPERADMIN E GARANTIR QUE EXISTE NO BANCO COM SENHA CORRETA
          if (process.env.SUPERADMIN_EMAIL && credentials.email === process.env.SUPERADMIN_EMAIL) {
            let superadmin = await usersCollection.findOne({
              email: process.env.SUPERADMIN_EMAIL,
              role: 'superadmin'
            });

            if (!superadmin || !superadmin.password || superadmin.password.length === 0) {
              if (!process.env.SUPERADMIN_PASSWORD) {
                throw new Error('SUPERADMIN_PASSWORD não está definida nas variáveis de ambiente');
              }
              // Recriar o superadmin com senha hash
              await usersCollection.deleteMany({ email: process.env.SUPERADMIN_EMAIL, role: 'superadmin' });
              const hashedPassword = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 12);
              const insertResult = await usersCollection.insertOne({
                name: 'Super Admin',
                email: process.env.SUPERADMIN_EMAIL,
                password: hashedPassword,
                role: 'superadmin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              superadmin = await usersCollection.findOne({ _id: insertResult.insertedId });
            }

            if (superadmin) {
              const isPasswordValid = await bcrypt.compare(credentials.password, superadmin.password);
              if (!isPasswordValid) return null;
              return {
                id: superadmin._id.toString(),
                name: superadmin.name,
                email: superadmin.email,
                role: superadmin.role,
                image: superadmin.image,
              };
            }
          }

          const user = await usersCollection.findOne({ email: credentials.email, isActive: true });

          if (!user) {
            console.warn('Login: usuário não encontrado para o email informado.');
            return null;
          }

          if (!user.password) {
            // Conta criada via OAuth — sem senha definida
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          // Verificar se o professor está ativo (convite ou criação direta pelo superadmin)
          if (user.role === 'professor' && !user.isActive) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
            profileCompleted: user.profileCompleted || false,
          };
        } catch (error) {
          console.error('Erro no fluxo de login:', error instanceof Error ? error.message : error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Se for superadmin, permitir login sempre
      if (user?.role === 'superadmin') {
        return true;
      }

      // Em desenvolvimento com bypass explícito, permitir qualquer login
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.DEV_AUTH_BYPASS === 'true'
      ) {
        if (!user.role) user.role = 'aluno';
        return true;
      }

      // Processar Google OAuth
      if (account?.provider === 'google') {
        try {
          // Usar o pool de conexões centralizado (não desconectar manualmente)
          await connectDB();

          const db = mongoose.connection.db;
          if (!db) throw new Error('Não foi possível conectar ao banco de dados');

          const usersCollection = db.collection('users');
          const invitesCollection = db.collection('invites');

          // Usuário já existe: atualizar dados e restaurar role
          const existingUser = await usersCollection.findOne({ email: user.email });
          if (existingUser) {
            await usersCollection.updateOne(
              { _id: existingUser._id },
              { $set: { name: user.name, image: user.image, updatedAt: new Date() } }
            );
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
            return true;
          }

          // Verificar convite pendente e válido para professor
          const invite = await invitesCollection.findOne({
            email: user.email,
            isUsed: false,
            expiresAt: { $gt: new Date() }
          });

          if (invite) {
            const insertResult = await usersCollection.insertOne({
              name: user.name!,
              email: user.email!,
              image: user.image,
              role: 'professor',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            await invitesCollection.updateOne(
              { _id: invite._id },
              { $set: { isUsed: true, usedAt: new Date() } }
            );
            user.id = insertResult.insertedId.toString();
            user.role = 'professor';
            return true;
          }

          // Novo aluno via Google — criação automática
          const insertResult = await usersCollection.insertOne({
            name: user.name!,
            email: user.email!,
            image: user.image,
            role: 'aluno',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          user.id = insertResult.insertedId.toString();
          user.role = 'aluno';
          return true;
        } catch (error) {
          console.error('Erro no Google OAuth:', error instanceof Error ? error.message : error);
          return false;
        }
      }

      // Fallback: garantir que todos os usuários tenham um papel definido
      if (!user.role) {
        user.role = 'aluno';
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // 1. Initial Sign In (user object is available)
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
        token.profileCompleted = user.profileCompleted;

        // Validar imagem base64 grande
        if (user.image?.startsWith('data:image') && user.image.length > 1024) {
          token.picture = undefined; // Não armazenar no token
        }

        // Sessão única para alunos: aguardar a invalidação antes de emitir o token
        if (user.role === 'aluno' && user.id) {
          try {
            await invalidateUserSessions(user.id);
          } catch (e) {
            console.error('Erro ao invalidar sessões anteriores do aluno:', e);
            // Não bloquear o login em caso de falha, mas registrar o erro
          }
        }
      }

      // 2. Session Update (trigger === 'update')
      if (trigger === 'update' && session?.user) {
        if (session.user.name) token.name = session.user.name;
        if (session.user.role) token.role = session.user.role;

        if (session.user.image) {
          // Não salvar base64 grande no token
          if (session.user.image.startsWith('data:image') && session.user.image.length > 1024) {
            token.picture = undefined;
          } else {
            token.picture = session.user.image;
          }
        }

        if (session.user.profileCompleted !== undefined) {
          token.profileCompleted = session.user.profileCompleted;
        }
      }

      // 3. Fallback: Se faltar dados críticos no token (ex: role ou profileCompleted)
      // Isso acontece se o token for antigo ou se algo falhou no login
      if (!token.role || token.profileCompleted === undefined) {
        // Evitar consulta ao banco para o superadmin (identificado pela env var)
        if (process.env.SUPERADMIN_EMAIL && token.email === process.env.SUPERADMIN_EMAIL) {
          token.role = 'superadmin';
          if (!token.name) token.name = 'Super Admin';
          return token;
        }

        try {
          await connectDB();
          // Buscar apenas os campos necessários (ID é buscado pelo email se sub não existir)
          const query = token.sub ? { _id: token.sub } : { email: token.email };

          // Usar lean() para performance se possível, mas Model.findOne retorna documento
          const dbUser = await User.findOne(query).select('role profileCompleted name avatar image');

          if (dbUser) {
            token.sub = dbUser._id.toString();
            token.role = dbUser.role || 'aluno';
            token.profileCompleted = dbUser.profileCompleted || false;
            if (!token.name) token.name = dbUser.name;

            // Recuperar imagem se não estiver no token
            if (!token.picture) {
              const avatar = dbUser.avatar || dbUser.image;
              if (avatar && !avatar.startsWith('data:image')) {
                token.picture = avatar;
              }
            }
          } else {
            // Se não achar user no banco (pode ser superadmin ou erro), define fallback seguro
            token.role = token.role || 'aluno';
          }
        } catch (error) {
          console.error('Erro ao hidratar token:', error);
          // Fallback para não quebrar a sessão
          if (!token.role) token.role = 'aluno';
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Otimização: Session lê DIRETAMENTE do token, sem ir ao banco
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.picture as string) || undefined;
        session.user.profileCompleted = token.profileCompleted as boolean;
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
