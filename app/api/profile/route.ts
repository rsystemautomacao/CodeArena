import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Importar modelo para garantir que está registrado
import '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('❌ GET PROFILE: Sessão não encontrada');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!session.user.email) {
      console.error('❌ GET PROFILE: Email não encontrado na sessão:', session.user);
      return NextResponse.json({ error: 'Email não encontrado na sessão' }, { status: 401 });
    }

    console.log('🔍 GET PROFILE: Buscando perfil para:', session.user.email);

    const dbConnection = await connectDB();
    if (!dbConnection) {
      console.error('❌ GET PROFILE: Não foi possível conectar ao banco de dados');
      return NextResponse.json({ error: 'Erro ao conectar com o banco de dados' }, { status: 500 });
    }

    // Garantir que o modelo está registrado
    const UserModel = (await import('@/models/User')).default;
    if (!UserModel) {
      console.error('❌ GET PROFILE: Modelo User não encontrado');
      return NextResponse.json({ error: 'Erro ao carregar modelo do banco de dados' }, { status: 500 });
    }

    let user;
    try {
      user = await UserModel.findOne({ email: session.user.email.toLowerCase() })
        .select('-password');

      if (!user) {
        console.error('❌ GET PROFILE: Usuário não encontrado no banco:', session.user.email);
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }

      console.log('✅ GET PROFILE: Usuário encontrado:', user._id);
    } catch (dbError: any) {
      console.error('❌ GET PROFILE: Erro ao buscar usuário no banco:', dbError);
      return NextResponse.json({ error: 'Erro ao buscar perfil no banco de dados' }, { status: 500 });
    }

    // Criar objeto de resposta com todos os campos garantidos
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      location: user.location || '',
      address: user.address || '',
      subjects: user.subjects || [],
      avatar: user.avatar || user.image || '',
      image: user.image || user.avatar || '',
      role: user.role,
      isActive: user.isActive,
      profileCompleted: user.profileCompleted || false,
      // Campos específicos para aluno
      enrollment: user.enrollment || '',
      course: user.course || '',
      semester: user.semester || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(userResponse);
  } catch (error: any) {
    console.error('❌ GET PROFILE: Erro geral ao buscar perfil:', error);
    console.error('❌ GET PROFILE: Stack trace:', error?.stack);
    console.error('❌ GET PROFILE: Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      debug: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔍 PUT PROFILE: Sessão recebida:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id
    });
    
    if (!session || !session.user) {
      console.error('❌ PUT PROFILE: Sessão não encontrada');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!session.user.email) {
      console.error('❌ PUT PROFILE: Email não encontrado na sessão:', session.user);
      return NextResponse.json({ error: 'Email não encontrado na sessão' }, { status: 401 });
    }

    const dbConnection = await connectDB();
    if (!dbConnection) {
      console.error('❌ PUT PROFILE: Não foi possível conectar ao banco de dados');
      return NextResponse.json({ error: 'Erro ao conectar com o banco de dados' }, { status: 500 });
    }

    // Garantir que o modelo está registrado
    const User = (await import('@/models/User')).default;
    if (!User) {
      console.error('❌ PUT PROFILE: Modelo User não encontrado');
      return NextResponse.json({ error: 'Erro ao carregar modelo do banco de dados' }, { status: 500 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const bio = formData.get('bio') as string;
    const location = formData.get('location') as string;
    const address = formData.get('address') as string;
    const subjectsStr = formData.get('subjects') as string;
    const avatarFile = formData.get('avatar') as File;
    // Campos específicos para aluno
    const enrollment = formData.get('enrollment') as string;
    const course = formData.get('course') as string;
    const semester = formData.get('semester') as string;
    const profileCompleted = formData.get('profileCompleted') === 'true';
    
    // Processar matérias (array de strings)
    let subjects: string[] = [];
    if (subjectsStr) {
      try {
        subjects = JSON.parse(subjectsStr);
      } catch {
        // Se não for JSON válido, tratar como string separada por vírgulas
        subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }

    console.log('🔍 DADOS RECEBIDOS:', {
      name,
      phone,
      bio,
      location,
      hasAvatarFile: !!avatarFile,
      avatarSize: avatarFile?.size
    });

    // Buscar o usuário existente
    console.log('🔍 PUT PROFILE: Buscando usuário no banco:', session.user.email);
    
    let existingUser;
    try {
      existingUser = await User.findOne({ email: session.user.email.toLowerCase() });
    } catch (dbError: any) {
      console.error('❌ PUT PROFILE: Erro ao buscar usuário no banco:', dbError);
      return NextResponse.json({ error: 'Erro ao buscar usuário no banco de dados' }, { status: 500 });
    }
    
    if (!existingUser) {
      console.error('❌ PUT PROFILE: Usuário não encontrado no banco:', session.user.email);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.log('✅ PUT PROFILE: Usuário encontrado:', existingUser._id);

    // Atualizar os campos diretamente no objeto
    existingUser.name = name;
    existingUser.phone = phone;
    existingUser.bio = bio;
    existingUser.location = location;
    existingUser.address = address;
    existingUser.subjects = subjects;
    
    // Campos específicos para aluno
    if (existingUser.role === 'aluno') {
      existingUser.enrollment = enrollment || '';
      existingUser.course = course || '';
      existingUser.semester = semester || '';
      if (profileCompleted) {
        existingUser.profileCompleted = true;
      }
    }

    // Se uma nova foto foi enviada
    if (avatarFile && avatarFile.size > 0) {
      try {
        // Verificar se estamos em produção (Vercel)
        // Em produção, não podemos salvar arquivos em public/ pois são temporários
        // Vamos converter para base64 e salvar no banco, ou usar um serviço de storage
        
        // Converter File para Buffer
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Verificar se é ambiente de produção (Vercel)
        const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
        
        if (isProduction) {
          // Em produção: converter para base64 e salvar no banco ou usar URL externa
          // Por enquanto, vamos usar base64 como fallback
          const base64Image = buffer.toString('base64');
          const mimeType = avatarFile.type || 'image/jpeg';
          const avatarUrl = `data:${mimeType};base64,${base64Image}`;
          
          existingUser.avatar = avatarUrl;
          existingUser.image = avatarUrl;
          
          console.log('✅ AVATAR SALVO COMO BASE64 (PRODUÇÃO):', {
            size: buffer.length,
            mimeType
          });
        } else {
          // Em desenvolvimento: salvar arquivo localmente
          const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
          await mkdir(avatarsDir, { recursive: true });

          // Gerar nome único para o arquivo
          const timestamp = Date.now();
          const fileExtension = path.extname(avatarFile.name) || '.jpg';
          const fileName = `avatar_${existingUser._id}_${timestamp}${fileExtension}`;
          const filePath = path.join(avatarsDir, fileName);

          await writeFile(filePath, buffer);

          // Atualizar URLs no banco
          const avatarUrl = `/avatars/${fileName}`;
          existingUser.avatar = avatarUrl;
          existingUser.image = avatarUrl;

          console.log('✅ AVATAR SALVO LOCALMENTE (DESENVOLVIMENTO):', {
            fileName,
            filePath,
            avatarUrl,
            size: buffer.length
          });
        }
      } catch (error) {
        console.error('❌ ERRO AO SALVAR AVATAR:', error);
        // Continuar sem avatar se houver erro
      }
    }

    console.log('🔍 DADOS ANTES DE SALVAR:', {
      name: existingUser.name,
      phone: existingUser.phone,
      bio: existingUser.bio,
      location: existingUser.location
    });

    // Salvar o documento
    let savedUser;
    try {
      savedUser = await existingUser.save();
      console.log('✅ PUT PROFILE: Perfil salvo com sucesso:', {
        id: savedUser._id,
        name: savedUser.name,
        phone: savedUser.phone,
        bio: savedUser.bio,
        location: savedUser.location,
        avatar: savedUser.avatar,
        image: savedUser.image
      });
    } catch (saveError: any) {
      console.error('❌ PUT PROFILE: Erro ao salvar usuário no banco:', saveError);
      console.error('❌ PUT PROFILE: Stack trace:', saveError?.stack);
      return NextResponse.json({ 
        error: 'Erro ao salvar perfil no banco de dados',
        debug: process.env.NODE_ENV === 'development' ? saveError?.message : undefined
      }, { status: 500 });
    }

    // Criar objeto de resposta com todos os campos garantidos
    const userResponse = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      phone: savedUser.phone || '',
      bio: savedUser.bio || '',
      location: savedUser.location || '',
      address: savedUser.address || '',
      subjects: savedUser.subjects || [],
      avatar: savedUser.avatar || savedUser.image || '',
      image: savedUser.image || savedUser.avatar || '',
      role: savedUser.role,
      isActive: savedUser.isActive,
      profileCompleted: savedUser.profileCompleted || false,
      // Campos específicos para aluno
      enrollment: savedUser.enrollment || '',
      course: savedUser.course || '',
      semester: savedUser.semester || '',
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    console.log('🔍 RETORNANDO USUÁRIO SALVO:', userResponse);

    return NextResponse.json(userResponse);
  } catch (error: any) {
    console.error('❌ PUT PROFILE: Erro geral ao atualizar perfil:', error);
    console.error('❌ PUT PROFILE: Stack trace:', error?.stack);
    console.error('❌ PUT PROFILE: Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      debug: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
