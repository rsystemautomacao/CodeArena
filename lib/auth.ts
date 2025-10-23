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

        // CONECTAR AO BANCO E VERIFICAR USUÁRIO
        try {
          console.log('🔗 CONECTANDO AO BANCO DE DADOS...');
          const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rsautomacao2000_db_user:%40Desbravadores%4093@codearena-cluster.6b3h9ce.mongodb.net/?retryWrites=true&w=majority&appName=CodeArena-Cluster';
          
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
          if (credentials.email === 'admin@rsystem.com') {
            console.log('🔧 VERIFICANDO SUPERADMIN...');
            let superadmin = await usersCollection.findOne({ 
              email: 'admin@rsystem.com',
              role: 'superadmin'
            });
            
            if (!superadmin || !superadmin.password || superadmin.password.length === 0) {
              console.log('🔧 RECRIANDO SUPERADMIN...');
              // Deletar superadmin existente
              await usersCollection.deleteMany({ 
                email: 'admin@rsystem.com',
                role: 'superadmin'
              });
              
              // Criar novo superadmin
              const hashedPassword = await bcrypt.hash('@Desbravadores@93', 12);
              const newSuperadmin = {
                name: 'Super Admin',
                email: 'admin@rsystem.com',
                password: hashedPassword,
                role: 'superadmin',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              const result = await usersCollection.insertOne(newSuperadmin);
              console.log('✅ SUPERADMIN RECRIADO:', result.insertedId);
              
              superadmin = await usersCollection.findOne({ 
                email: 'admin@rsystem.com',
                role: 'superadmin'
              });
            }
            
            if (superadmin) {
              console.log('✅ SUPERADMIN ENCONTRADO:', {
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
              await mongoose.disconnect();
              return null;
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
