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
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Proteger rotas do dashboard
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        
        // Proteger rotas de API que precisam de autenticação
        if (req.nextUrl.pathname.startsWith('/api/submissions') ||
            req.nextUrl.pathname.startsWith('/api/test-code')) {
          return !!token;
        }
        
        // Permitir acesso à validação de convites sem autenticação
        if (req.nextUrl.pathname.startsWith('/api/invites/validate/')) {
          return true;
        }
        
        // Proteger criação de convites (apenas superadmin)
        if (req.nextUrl.pathname.startsWith('/api/invites') && 
            !req.nextUrl.pathname.startsWith('/api/invites/validate/')) {
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
