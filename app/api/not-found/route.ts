import { NextResponse } from 'next/server';

// Resposta silenciosa para arquivos que não existem (PWA, Vite, etc.)
const silent404Response = new NextResponse(null, { 
  status: 404,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

export async function GET() {
  return silent404Response;
}

export async function POST() {
  return silent404Response;
}

export async function PUT() {
  return silent404Response;
}

export async function DELETE() {
  return silent404Response;
}

export async function HEAD() {
  return silent404Response;
}

export async function OPTIONS() {
  return silent404Response;
}
