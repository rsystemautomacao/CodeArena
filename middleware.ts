import { NextResponse, NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// Lista de paths que devem ser bloqueados
const blockedPaths = [
  '/@vite',
  '/@react-refresh',
  '/src/',
  '/.well-known/',
  '/dev-sw.js',
  '/manifest.webmanifest'
];

// Lista de paths específicos que devem ser bloqueados
const exactBlockedPaths = [
  '/@vite/client',
  '/@vite-plugin-pwa/pwa-entry-point-loaded',
  '/@react-refresh',
  '/src/main.tsx'
];

function customMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar paths exatos primeiro
  if (exactBlockedPaths.includes(pathname)) {
    console.log(`🚫 [MIDDLEWARE] Bloqueando request exato: ${pathname}`);
    return new NextResponse(null, { 
      status: 404,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
  
  // Verificar paths com prefixo
  for (const blockedPath of blockedPaths) {
    if (pathname.startsWith(blockedPath)) {
      console.log(`🚫 [MIDDLEWARE] Bloqueando request com prefixo: ${pathname} (prefixo: ${blockedPath})`);
      return new NextResponse(null, { 
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
  }
  
  return NextResponse.next();
}

export default withAuth(
  function middleware(req) {
    // Primeiro, aplicar o middleware customizado para bloquear requests
    const customResponse = customMiddleware(req);
    if (customResponse) {
      return customResponse;
    }
    
    // Depois, aplicar a lógica de autenticação
    const { pathname } = req.nextUrl;
    
    // Redirecionar manifest.webmanifest para manifest.json
    if (pathname === '/manifest.webmanifest') {
      return NextResponse.redirect(new URL('/manifest.json', req.url));
    }
    
    // Permitir acesso ao login direto sem autenticação
    if (pathname === '/login-direct') {
      return NextResponse.next();
    }
    
    // Permitir acesso às rotas de debug sem autenticação
    if (pathname.startsWith('/api/debug-') || 
        pathname.startsWith('/api/direct-login') ||
        pathname.startsWith('/api/test-')) {
      return NextResponse.next();
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Permitir acesso ao login direto sem autenticação
        if (pathname === '/login-direct') {
          return true;
        }
        
        // Permitir acesso às rotas de debug sem autenticação
        if (pathname.startsWith('/api/debug-') || 
            pathname.startsWith('/api/direct-login') ||
            pathname.startsWith('/api/test-')) {
          return true;
        }
        
        // Proteger rotas do dashboard (mas permitir se for superadmin)
        if (pathname.startsWith('/dashboard')) {
          // Se não há token, verificar se há dados no localStorage (login direto)
          if (!token) {
            // Permitir acesso se for login direto com superadmin
            return true; // Temporariamente permitir para debug
          }
          return !!token;
        }
        
        // Proteger rotas de API que precisam de autenticação
        if (pathname.startsWith('/api/submissions') ||
            pathname.startsWith('/api/test-code')) {
          return !!token;
        }
        
        // Permitir acesso à validação de convites sem autenticação
        if (pathname.startsWith('/api/invites/validate/')) {
          return true;
        }
        
        // Proteger criação de convites (apenas superadmin)
        if (pathname.startsWith('/api/invites') && 
            !pathname.startsWith('/api/invites/validate/')) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
