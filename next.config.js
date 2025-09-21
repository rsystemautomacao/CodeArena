/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Configurações para evitar erros 404
  async rewrites() {
    return [
      // Redirecionar requests de PWA para 404 silencioso
      {
        source: '/manifest.webmanifest',
        destination: '/api/not-found',
      },
      {
        source: '/dev-sw.js',
        destination: '/api/not-found',
      },
      {
        source: '/@vite/:path*',
        destination: '/api/not-found',
      },
      {
        source: '/@react-refresh',
        destination: '/api/not-found',
      },
      {
        source: '/src/:path*',
        destination: '/api/not-found',
      },
    ];
  },
}

module.exports = nextConfig
