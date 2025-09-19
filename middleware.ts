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
            req.nextUrl.pathname.startsWith('/api/test-code') ||
            req.nextUrl.pathname.startsWith('/api/invites')) {
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
