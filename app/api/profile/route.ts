import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email })
      .select('-password');

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Criar objeto de resposta com todos os campos garantidos
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      location: user.location || '',
      avatar: user.avatar || user.image || '',
      image: user.image || user.avatar || '',
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const bio = formData.get('bio') as string;
    const location = formData.get('location') as string;
    const avatarFile = formData.get('avatar') as File;

    console.log('🔍 DADOS RECEBIDOS:', {
      name,
      phone,
      bio,
      location,
      hasAvatarFile: !!avatarFile,
      avatarSize: avatarFile?.size
    });

    // Buscar o usuário existente
    const existingUser = await User.findOne({ email: session.user.email });
    
    if (!existingUser) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO:', session.user.email);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Atualizar os campos diretamente no objeto - EXATAMENTE como o name
    existingUser.name = name;
    existingUser.phone = phone;
    existingUser.bio = bio;
    existingUser.location = location;

    // Se uma nova foto foi enviada
    if (avatarFile && avatarFile.size > 0) {
      try {
        // Criar pasta avatars se não existir
        const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
        await mkdir(avatarsDir, { recursive: true });

        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const fileExtension = path.extname(avatarFile.name);
        const fileName = `avatar_${existingUser._id}_${timestamp}${fileExtension}`;
        const filePath = path.join(avatarsDir, fileName);

        // Converter File para Buffer e salvar
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Atualizar URLs no banco
        const avatarUrl = `/avatars/${fileName}`;
        existingUser.avatar = avatarUrl;
        existingUser.image = avatarUrl;

        console.log('✅ AVATAR SALVO:', {
          fileName,
          filePath,
          avatarUrl,
          size: buffer.length
        });
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
    const savedUser = await existingUser.save();

    console.log('✅ PERFIL SALVO COM SUCESSO:', {
      id: savedUser._id,
      name: savedUser.name,
      phone: savedUser.phone,
      bio: savedUser.bio,
      location: savedUser.location
    });

    // Criar objeto de resposta com todos os campos garantidos
    const userResponse = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      phone: savedUser.phone || '',
      bio: savedUser.bio || '',
      location: savedUser.location || '',
      avatar: savedUser.avatar || savedUser.image || '',
      image: savedUser.image || savedUser.avatar || '',
      role: savedUser.role,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    console.log('🔍 RETORNANDO USUÁRIO SALVO:', userResponse);

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error('❌ ERRO AO ATUALIZAR PERFIL:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
