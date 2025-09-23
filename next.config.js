/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Configurações para evitar erros 404
  async headers() {
    return [
      {
        source: '/@vite/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/@react-refresh',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/src/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/@vite-plugin-pwa/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Redirecionar requests problemáticos para página inicial
      {
        source: '/manifest.webmanifest',
        destination: '/manifest.json',
        permanent: false,
      },
      {
        source: '/dev-sw.js',
        destination: '/',
        permanent: false,
      },
      {
        source: '/app%20sos%20dente.jpeg',
        destination: '/',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      // Interceptar requests do Vite e outros frameworks
      {
        source: '/@vite/:path*',
        destination: '/blocked.html',
      },
      {
        source: '/@react-refresh',
        destination: '/blocked.html',
      },
      {
        source: '/src/:path*',
        destination: '/blocked.html',
      },
      {
        source: '/.well-known/:path*',
        destination: '/blocked.html',
      },
      {
        source: '/@vite-plugin-pwa/:path*',
        destination: '/blocked.html',
      },
    ];
  },
  // Configurações para evitar warnings desnecessários
  experimental: {
    esmExternals: false,
  },
}

module.exports = nextConfig
