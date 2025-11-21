import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './mongodb';
import User from '@/models/User';

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
        if (credentials.email === 'admin@rsystem.com' && credentials.password === '@Desbravadores@93') {
          console.log('✅ SUPERADMIN DETECTADO - LOGIN DIRETO');
          console.log('🔐 CREDENCIAIS SUPERADMIN:', {
            email: credentials.email,
            password: credentials.password,
            match: credentials.email === 'admin@rsystem.com' && credentials.password === '@Desbravadores@93'
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
            console.log('🔧 VERIFICANDO SUPERADMIN NO BANCO...');
            let superadmin = await usersCollection.findOne({ 
              email: 'admin@rsystem.com',
              role: 'superadmin'
            });
            
            if (!superadmin || !superadmin.password || superadmin.password.length === 0) {
              console.log('🔧 RECRIANDO SUPERADMIN NO BANCO...');
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
              console.log('✅ SUPERADMIN RECRIADO NO BANCO:', result.insertedId);
              
              superadmin = await usersCollection.findOne({ 
                email: 'admin@rsystem.com',
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
      console.log('🔑 JWT CALLBACK:', { 
        hasUser: !!user, 
        userRole: user?.role, 
        userEmail: user?.email,
        userId: user?.id,
        tokenRole: token.role,
        tokenSub: token.sub,
        trigger,
        sessionName: session?.user?.name
      });
      
      // Quando o usuário faz login
      if (user) {
        // Garantir que token.sub seja definido com o ID do usuário
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        // CRÍTICO: Não armazenar base64 grande no token (evita REQUEST_HEADER_TOO_LARGE)
        if (user.image) {
          // Se for base64 e muito grande, não armazenar no token
          if (user.image.startsWith('data:image') && user.image.length > 1024) {
            console.log('⚠️ IGNORANDO BASE64 GRANDE NO TOKEN AO FAZER LOGIN');
            token.picture = undefined; // Não armazenar base64 grande
          } else {
            token.picture = user.image;
          }
        } else {
          token.picture = user.image;
        }
        token.profileCompleted = user.profileCompleted;
        console.log('✅ DADOS DO USUÁRIO DEFINIDOS NO TOKEN:', { 
          sub: token.sub,
          role: user.role, 
          name: user.name, 
          hasImage: !!token.picture,
          imageLength: token.picture?.length || 0,
          profileCompleted: user.profileCompleted 
        });
      }
      
      // Garantir que token.sub sempre existe
      if (!token.sub && token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email }).select('_id');
          if (dbUser) {
            token.sub = dbUser._id.toString();
            console.log('✅ TOKEN.SUB DEFINIDO DO BANCO:', token.sub);
          }
        } catch (error) {
          console.error('Erro ao buscar ID do usuário:', error);
        }
      }
      
      // Buscar profileCompleted do banco apenas uma vez se não estiver no token
      if (token.profileCompleted === undefined && token.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email }).select('profileCompleted');
          if (dbUser) {
            token.profileCompleted = dbUser.profileCompleted || false;
          } else {
            token.profileCompleted = false;
          }
        } catch (error) {
          console.error('Erro ao buscar profileCompleted:', error);
          token.profileCompleted = false;
        }
      }
      
      // Quando update() é chamado (trigger === 'update')
      if (trigger === 'update' && session) {
        if (session.user?.name) {
          token.name = session.user.name;
          console.log('✅ NOME ATUALIZADO NO TOKEN:', session.user.name);
        }
        if (session.user?.image) {
          // CRÍTICO: Não armazenar base64 no token (pode causar REQUEST_HEADER_TOO_LARGE)
          // Se a imagem for base64 (data:image), buscar do banco e usar URL ou limitar tamanho
          const imageValue = session.user.image;
          
          // Se for base64 e muito grande (> 1KB), não atualizar no token
          if (imageValue.startsWith('data:image') && imageValue.length > 1024) {
            console.log('⚠️ IMAGEM BASE64 MUITO GRANDE - NÃO ATUALIZANDO NO TOKEN (evitar REQUEST_HEADER_TOO_LARGE)');
            // Buscar URL do banco em vez de usar base64
            try {
              await connectDB();
              const dbUser = await User.findOne({ email: token.email }).select('avatar image');
              if (dbUser && (dbUser.avatar || dbUser.image)) {
                // Usar URL se existir, senão usar apenas uma referência pequena
                const avatarUrl = dbUser.avatar || dbUser.image;
                if (avatarUrl && !avatarUrl.startsWith('data:image')) {
                  token.picture = avatarUrl;
                  console.log('✅ URL DA IMAGEM ATUALIZADA NO TOKEN:', avatarUrl);
                } else {
                  // Se for base64, usar apenas um hash ou omitir
                  token.picture = undefined; // Não armazenar base64 grande no token
                  console.log('⚠️ IGNORANDO BASE64 GRANDE NO TOKEN');
                }
              }
            } catch (e) {
              console.error('Erro ao buscar avatar do banco:', e);
            }
          } else {
            // Se não for base64 ou for pequeno, atualizar normalmente
            token.picture = imageValue;
            console.log('✅ IMAGEM ATUALIZADA NO TOKEN (URL ou pequena):', imageValue.substring(0, 100));
          }
        }
      }
      
      // FORÇAR SUPERADMIN SE FOR O EMAIL CORRETO
      if (user?.email === 'admin@rsystem.com' || token.email === 'admin@rsystem.com') {
        token.role = 'superadmin';
        console.log('🔧 FORÇANDO ROLE SUPERADMIN PARA:', user?.email || token.email);
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('📋 SESSION CALLBACK:', { 
        tokenRole: token.role,
        tokenName: token.name,
        sessionUserRole: session.user?.role,
        sessionUserEmail: session.user?.email,
        sessionUserName: session.user?.name
      });
      
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        
        // Atualizar nome e imagem do token se existirem
        if (token.name) {
          session.user.name = token.name as string;
        }
        // CRÍTICO: Não passar base64 grande na sessão (evita REQUEST_HEADER_TOO_LARGE)
        if (token.picture) {
          const pictureValue = token.picture as string;
          // Se for base64 e muito grande, buscar URL do banco em vez disso
          if (pictureValue.startsWith('data:image') && pictureValue.length > 1024) {
            try {
              await connectDB();
              const dbUser = await User.findOne({ email: token.email }).select('avatar image');
              if (dbUser) {
                const avatarUrl = dbUser.avatar || dbUser.image;
                // Se houver URL (não base64), usar ela
                if (avatarUrl && !avatarUrl.startsWith('data:image')) {
                  session.user.image = avatarUrl;
                } else {
                  // Se for base64, não passar na sessão para evitar header muito grande
                  session.user.image = undefined;
                  console.log('⚠️ BASE64 GRANDE DETECTADO - NÃO PASSANDO NA SESSÃO');
                }
              }
            } catch (e) {
              console.error('Erro ao buscar avatar do banco:', e);
              session.user.image = undefined; // Não passar base64 grande
            }
          } else {
            session.user.image = pictureValue;
          }
        }
        
        // Atualizar profileCompleted do token se existir
        if (token.profileCompleted !== undefined) {
          session.user.profileCompleted = token.profileCompleted as boolean;
        }
        
        // FORÇAR SUPERADMIN SE FOR O EMAIL CORRETO
        if (session.user.email === 'admin@rsystem.com') {
          session.user.role = 'superadmin';
          console.log('🔧 FORÇANDO SESSION ROLE SUPERADMIN PARA:', session.user.email);
        }
      }
      
      console.log('✅ SESSION FINAL:', { 
        userRole: session.user?.role, 
        userEmail: session.user?.email,
        userName: session.user?.name,
        profileCompleted: session.user?.profileCompleted
      });
      
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
