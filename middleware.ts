import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Middleware logic here if needed
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
    '/dashboard/:path*',
    '/api/submissions/:path*',
    '/api/test-code/:path*',
    '/api/invites/:path*',
  ],
};
