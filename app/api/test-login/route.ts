import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('🔍 TESTE LOGIN - EMAIL:', email);
    console.log('🔍 TESTE LOGIN - PASSWORD:', password ? 'PRESENTE' : 'AUSENTE');
    console.log('🔍 TESTE LOGIN - NODE_ENV:', process.env.NODE_ENV);
    
    await connectDB();
    const mongoose = await import('mongoose');
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Erro de conexão com o banco de dados'
      });
    }
    
    const usersCollection = db.collection('users');
    const invitesCollection = db.collection('invites');
    
    // Buscar usuário
    const user = await usersCollection.findOne({
      email: email.toLowerCase()
    });
    
    console.log('🔍 TESTE LOGIN - USER ENCONTRADO:', user ? 'SIM' : 'NÃO');
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado',
        debug: {
          email: email.toLowerCase(),
          userFound: false
        }
      });
    }
    
    console.log('🔍 TESTE LOGIN - USER ROLE:', user.role);
    console.log('🔍 TESTE LOGIN - USER ACTIVE:', user.isActive);
    
    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 TESTE LOGIN - PASSWORD MATCH:', passwordMatch);
    
    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        error: 'Senha incorreta',
        debug: {
          email: email.toLowerCase(),
          userFound: true,
          passwordMatch: false,
          userRole: user.role,
          userActive: user.isActive
        }
      });
    }
    
    // Verificar se é professor e tem convite válido
    if (user.role === 'professor') {
      const invite = await invitesCollection.findOne({
        email: email.toLowerCase(),
        isUsed: true
      });
      
      console.log('🔍 TESTE LOGIN - INVITE ENCONTRADO:', invite ? 'SIM' : 'NÃO');
      
      if (!invite) {
        return NextResponse.json({
          success: false,
          error: 'Professor sem convite válido',
          debug: {
            email: email.toLowerCase(),
            userFound: true,
            passwordMatch: true,
            userRole: user.role,
            userActive: user.isActive,
            inviteFound: false
          }
        });
      }
      
      console.log('🔍 TESTE LOGIN - INVITE DETAILS:', {
        email: invite.email,
        isUsed: invite.isUsed,
        createdAt: invite.createdAt
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Login válido',
      debug: {
        email: email.toLowerCase(),
        userFound: true,
        passwordMatch: true,
        userRole: user.role,
        userActive: user.isActive,
        inviteFound: user.role === 'professor' ? true : 'N/A'
      }
    });
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE LOGIN:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      debug: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
}