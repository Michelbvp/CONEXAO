import type { DefaultSession } from 'next-auth'

// Adiciona o campo "id" (id do usuário no banco) à sessão do NextAuth, que
// por padrão só expõe name/email/image. Preenchido no callback `session` em
// src/lib/auth.ts.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
  }
}
