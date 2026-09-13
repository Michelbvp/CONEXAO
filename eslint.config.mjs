import nextConfig from 'eslint-config-next'

// ESLint "flat config" (formato padrão a partir do ESLint 9). O
// eslint-config-next já vem pronto nesse formato, incluindo as regras de
// Core Web Vitals e TypeScript do Next.js.
const config = [
  ...nextConfig,
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
]

export default config
