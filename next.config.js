/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Cabeçalhos de segurança enviados em toda resposta.
  // Referência: OWASP Secure Headers Project.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS: força HTTPS em navegadores que já visitaram o site.
          // Só tem efeito real quando o app está servido via HTTPS (produção).
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },

  images: {
    // Fotos de perfil vêm do Google (contas/contatos) e, futuramente, do Google Fotos.
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
    ],
  },
}

module.exports = nextConfig
