import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './mongodb';
import User from '@/models/User';
import { invalidateUserSessions } from './session-manager';

// Debug das variáveis de ambiente
console.log('🔍 DEBUG AUTH CONFIG:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'CONFIGURADO' : 'FALTANDO');

// Variáveis hardcoded para garantir que funcionem
console.log('🔧 VARIÁVEIS DE AMBIENTE:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO');

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
        console.log('🔐 ===== INÍCIO DO LOGIN =====');
        console.log('📧 EMAIL RECEBIDO:', credentials?.email);
        console.log('🔑 SENHA RECEBIDA:', credentials?.password ? 'PRESENTE' : 'AUSENTE');
        console.log('🌍 AMBIENTE:', process.env.NODE_ENV);
        console.log('⚙️ SUPERADMIN_EMAIL:', process.env.SUPERADMIN_EMAIL);
        console.log('⚙️ SUPERADMIN_PASSWORD:', process.env.SUPERADMIN_PASSWORD ? 'CONFIGURADO' : 'FALTANDO');
        console.log('🔐 ================================');

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ ERRO: Credenciais vazias');
          console.log('📧 Email presente:', !!credentials?.email);
          console.log('🔑 Senha presente:', !!credentials?.password);
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

        // VERIFICAR SUPERADMIN PRIMEIRO (SEM BANCO DE DADOS)
        // Apenas se as variáveis de ambiente estiverem configuradas
        if (process.env.SUPERADMIN_EMAIL &&
          process.env.SUPERADMIN_PASSWORD &&
          credentials.email === process.env.SUPERADMIN_EMAIL &&
          credentials.password === process.env.SUPERADMIN_PASSWORD) {
          console.log('✅ SUPERADMIN DETECTADO - LOGIN DIRETO');
          console.log('🔐 CREDENCIAIS SUPERADMIN:', {
            email: credentials.email,
            password: credentials.password ? '***' : undefined, // Ocultar senha nos logs por segurança
            match: true
          });
          return {
            id: 'superadmin-001',
            name: 'Super Admin',
            email: 'admin@rsystem.com',
            role: 'superadmin',
            image: null,
          };
        }

        // CONECTAR AO BANCO E VERIFICAR USUÁRIO
        try {
          console.log('🔗 CONECTANDO AO BANCO DE DADOS...');
          const MONGODB_URI = process.env.MONGODB_URI;

          if (!MONGODB_URI) {
            throw new Error('MONGODB_URI não definida nas variáveis de ambiente');
          }

          await mongoose.connect(MONGODB_URI);
          console.log('✅ CONEXÃO COM BANCO ESTABELECIDA');

          const db = mongoose.connection.db;
          if (!db) {
            console.log('❌ ERRO: Não foi possível obter referência do banco');
            throw new Error('Não foi possível conectar ao banco de dados');
          }

          const usersCollection = db.collection('users');
          console.log('🔍 BUSCANDO USUÁRIO:', credentials.email);

          // VERIFICAR SE É SUPERADMIN E FORÇAR CRIAÇÃO SE NECESSÁRIO
          if (process.env.SUPERADMIN_EMAIL && credentials.email === process.env.SUPERADMIN_EMAIL) {
            console.log('🔧 VERIFICANDO SUPERADMIN NO BANCO...');
            let superadmin = await usersCollection.findOne({
              email: process.env.SUPERADMIN_EMAIL,
              role: 'superadmin'
            });

            if (!superadmin || !superadmin.password || superadmin.password.length === 0) {
              console.log('🔧 RECRIANDO SUPERADMIN NO BANCO...');
              // Deletar superadmin existente
              await usersCollection.deleteMany({
                email: process.env.SUPERADMIN_EMAIL,
                role: 'superadmin'
              });

              // Criar novo superadmin
              const adminPwd = process.env.SUPERADMIN_PASSWORD || 'admin123'; // Fallback seguro apenas para evitar crash, mas ideal é ter env
              const hashedPassword = await bcrypt.hash(adminPwd, 12);
              const newSuperadmin = {
                name: 'Super Admin',
                email: process.env.SUPERADMIN_EMAIL,
                password: hashedPassword,
                role: 'superadmin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              const result = await usersCollection.insertOne(newSuperadmin);
              console.log('✅ SUPERADMIN RECRIADO NO BANCO:', result.insertedId);

              superadmin = await usersCollection.findOne({
                email: process.env.SUPERADMIN_EMAIL,
                role: 'superadmin'
              });
            }

            if (superadmin) {
              console.log('✅ SUPERADMIN ENCONTRADO NO BANCO:', {
                id: superadmin._id,
                email: superadmin.email,
                hasPassword: !!superadmin.password,
                passwordLength: superadmin.password ? superadmin.password.length : 0
              });

              // Verificar senha
              console.log('🔑 VERIFICANDO SENHA DO SUPERADMIN...');
              const isPasswordValid = await bcrypt.compare(credentials.password, superadmin.password);
              console.log('🔑 RESULTADO DA VERIFICAÇÃO:', isPasswordValid);

              if (isPasswordValid) {
                console.log('✅ LOGIN SUPERADMIN SUCESSO!');
                await mongoose.disconnect();
                return {
                  id: superadmin._id.toString(),
                  name: superadmin.name,
                  email: superadmin.email,
                  role: superadmin.role,
                  image: superadmin.image,
                };
              } else {
                console.log('❌ SENHA DO SUPERADMIN INCORRETA');
                await mongoose.disconnect();
                return null;
              }
            }
          }

          const user = await usersCollection.findOne({
            email: credentials.email,
            isActive: true
          });

          if (!user) {
            console.log('❌ USUÁRIO NÃO ENCONTRADO NO BANCO');
            console.log('📧 Email buscado:', credentials.email);
            console.log('🔍 Buscando usuários com email similar...');

            // Buscar usuários similares para debug
            const similarUsers = await usersCollection.find({
              email: { $regex: credentials.email, $options: 'i' }
            }).toArray();
            console.log('👥 USUÁRIOS SIMILARES ENCONTRADOS:', similarUsers.length);
            similarUsers.forEach(u => {
              console.log('  - Email:', u.email, '| Ativo:', u.isActive, '| Role:', u.role);
            });

            await mongoose.disconnect();
            return null;
          }

          console.log('✅ USUÁRIO ENCONTRADO:', {
            id: user._id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            hasPassword: !!user.password,
            passwordLength: user.password ? user.password.length : 0
          });

          // Verificar senha
          console.log('🔑 VERIFICANDO SENHA...');
          console.log('🔑 Senha fornecida:', credentials.password);
          console.log('🔑 Hash no banco:', user.password ? 'PRESENTE' : 'AUSENTE');

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          console.log('🔑 RESULTADO DA VERIFICAÇÃO:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ SENHA INCORRETA');
            console.log('🔑 Senha fornecida:', credentials.password);
            console.log('🔑 Hash no banco:', user.password);
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
              console.log('🔍 VERIFICANDO SE É UM PROFESSOR CRIADO DIRETAMENTE...');

              // Se não tem convite, mas é um professor ativo, permitir login
              // (pode ser um professor criado diretamente pelo superadmin)
              if (user.isActive) {
                console.log('✅ PROFESSOR ATIVO SEM CONVITE - PERMITINDO LOGIN:', credentials.email);
              } else {
                await mongoose.disconnect();
                return null;
              }
            } else {
              console.log('✅ PROFESSOR COM CONVITE VÁLIDO:', credentials.email);
            }
          }

          console.log('✅ ===== LOGIN SUCESSO =====');
          console.log('🆔 ID:', user._id);
          console.log('📧 Email:', user.email);
          console.log('👤 Nome:', user.name);
          console.log('🎭 Role:', user.role);
          console.log('🖼️ Imagem:', user.image);
          console.log('✅ =========================');

          await mongoose.disconnect();

          const userToReturn = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
            profileCompleted: user.profileCompleted || false,
          };

          console.log('🚀 RETORNANDO USUÁRIO:', userToReturn);
          return userToReturn;
        } catch (error) {
          console.log('❌ ===== ERRO NO LOGIN =====');
          console.log('❌ Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
          console.log('❌ Mensagem:', error instanceof Error ? error.message : String(error));
          console.log('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
          console.log('❌ =========================');
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

      // Verificar se é superadmin por email
      if (user?.email === 'admin@rsystem.com') {
        user.role = 'superadmin';
        console.log('✅ SUPERADMIN POR EMAIL - ROLE DEFINIDO: superadmin');
        return true;
      }

      // Em desenvolvimento, permitir qualquer login
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ DEVELOPMENT MODE - PERMITINDO LOGIN');
        // Definir papel padrão para desenvolvimento
        if (!user.role) {
          user.role = 'aluno';
          console.log('✅ ROLE PADRÃO DEFINIDO PARA DESENVOLVIMENTO: aluno');
        }
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
          const MONGODB_URI = process.env.MONGODB_URI;

          if (!MONGODB_URI) {
            throw new Error('MONGODB_URI não definida nas variáveis de ambiente');
          }

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
            // Atualizar dados do Google e definir o papel do usuário
            await usersCollection.updateOne(
              { _id: existingUser._id },
              { $set: { name: user.name, image: user.image } }
            );

            // CRÍTICO: Definir user.id com o _id do MongoDB
            user.id = existingUser._id.toString();
            user.role = existingUser.role;
            console.log('✅ USUÁRIO EXISTENTE - ID DEFINIDO:', user.id);
            console.log('✅ USUÁRIO EXISTENTE - ROLE DEFINIDO:', existingUser.role);

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
            const insertResult = await usersCollection.insertOne({
              name: user.name!,
              email: user.email!,
              image: user.image,
              role: 'professor',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });

            // Buscar o usuário criado para obter o _id
            const newUser = await usersCollection.findOne({ _id: insertResult.insertedId });

            if (newUser) {
              // CRÍTICO: Definir user.id com o _id do MongoDB
              user.id = newUser._id.toString();
              user.role = 'professor';
              console.log('✅ NOVO PROFESSOR CRIADO - ID DEFINIDO:', user.id);
              console.log('✅ NOVO PROFESSOR CRIADO - ROLE DEFINIDO: professor');
            } else {
              // Fallback: usar insertedId se não conseguir buscar
              user.id = insertResult.insertedId.toString();
              user.role = 'professor';
              console.log('⚠️ USANDO INSERTED_ID COMO FALLBACK:', user.id);
            }

            // Marcar convite como usado
            await invitesCollection.updateOne(
              { _id: invite._id },
              { $set: { isUsed: true, usedAt: new Date() } }
            );

            await mongoose.disconnect();
            return true;
          }

          // Para alunos, permitir criação automática
          const insertResult = await usersCollection.insertOne({
            name: user.name!,
            email: user.email!,
            image: user.image,
            role: 'aluno',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          // Buscar o usuário criado para obter o _id
          const newUser = await usersCollection.findOne({ _id: insertResult.insertedId });

          if (newUser) {
            // CRÍTICO: Definir user.id com o _id do MongoDB
            user.id = newUser._id.toString();
            user.role = 'aluno';
            console.log('✅ NOVO ALUNO CRIADO - ID DEFINIDO:', user.id);
            console.log('✅ NOVO ALUNO CRIADO - ROLE DEFINIDO: aluno');
          } else {
            // Fallback: usar insertedId se não conseguir buscar
            user.id = insertResult.insertedId.toString();
            user.role = 'aluno';
            console.log('⚠️ USANDO INSERTED_ID COMO FALLBACK:', user.id);
          }

          await mongoose.disconnect();
          return true;
        } catch (error) {
          console.error('Erro no Google OAuth:', error);
          return false;
        }
      }

      // Fallback final - garantir que todos os usuários tenham um papel
      if (!user.role) {
        user.role = 'aluno';
        console.log('✅ ROLE PADRÃO DEFINIDO (FALLBACK): aluno');
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

        // Sessão única para alunos
        if (user.role === 'aluno' && user.id) {
          try {
            // Invalidação assíncrona (fire and forget) para não bloquear o login
            invalidateUserSessions(user.id).catch(err =>
              console.error('Erro ao invalidar sessões em background:', err)
            );
          } catch (e) {
            // Ignorar erro síncrono
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
        // Evitar consulta se for superadmin hardcoded
        if (token.email === 'admin@rsystem.com') {
          token.role = 'superadmin';
          token.sub = 'superadmin-001';
          token.name = 'Super Admin';
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

        // Tratamento especial para Super Admin Hardcoded
        if (session.user.email === 'admin@rsystem.com') {
          session.user.role = 'superadmin';
          session.user.id = 'superadmin-001';
        }
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
