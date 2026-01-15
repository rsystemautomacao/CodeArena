import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Apenas superadmin pode ver status detalhado
        if (!session || session.user.role !== 'superadmin') {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 403 }
            );
        }

        const report: any = {
            version: '1.0.0',
            environment: process.env.NODE_ENV,
            database: { status: 'unknown' },
            judge0: { status: 'unknown' },
            oauth: { status: 'unknown' }
        };

        // 1. Verificar Banco de Dados
        try {
            const start = Date.now();
            await connectDB();
            const latency = Date.now() - start;
            const state = mongoose.connection.readyState;

            report.database = {
                status: state === 1 ? 'connected' : 'disconnected',
                latency: `${latency}ms`,
                host: mongoose.connection.host
            };
        } catch (e: any) {
            report.database = {
                status: 'error',
                message: e.message
            };
        }

        // 2. Verificar Judge0
        try {
            const judgeUrl = process.env.JUDGE0_API_URL;
            const judgeKey = process.env.JUDGE0_API_KEY;

            if (!judgeUrl) {
                report.judge0 = { status: 'missing_config', message: 'URL não configurada' };
            } else {
                // Tentar um ping simples ou verificar linguagens
                // Usando fetch com timeout curto
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const headers: any = {};
                if (judgeKey) headers['X-RapidAPI-Key'] = judgeKey;
                // Ajustar header host se for rapidapi
                if (judgeUrl.includes('rapidapi')) headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';

                // Usar /about se possível, ou fallback para verificar apenas config
                const response = await fetch(`${judgeUrl}/about`, {
                    headers,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    report.judge0 = { status: 'operational', url: judgeUrl };
                } else {
                    // Try parsing text just in case
                    const text = await response.text();
                    report.judge0 = { status: 'warning', message: `Respondendo (Status ${response.status})` };
                }
            }
        } catch (e: any) {
            if (process.env.JUDGE0_API_URL) {
                report.judge0 = { status: 'configured', message: 'Configurado (Conexão falhou/Timeout)' };
            } else {
                report.judge0 = { status: 'error', message: e.message };
            }
        }

        // 3. Verificar OAuth
        const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
        const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;

        if (hasClientId && hasClientSecret) {
            report.oauth = { status: 'configured' };
        } else {
            report.oauth = {
                status: 'missing_config',
                details: {
                    clientId: hasClientId,
                    clientSecret: hasClientSecret
                }
            };
        }

        return NextResponse.json(report);

    } catch (error: any) {
        console.error('Erro ao verificar status do sistema:', error);
        return NextResponse.json(
            { error: 'Erro interno ao verificar status' },
            { status: 500 }
        );
    }
}
