import { PrismaAdapter } from '@next-auth/prisma-adapter'
import type { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import FacebookProvider from 'next-auth/providers/facebook'
import GoogleProvider from 'next-auth/providers/google'

import { garantirCategoriasPadrao } from '@/lib/onboarding'
import { prisma } from '@/lib/prisma'

const googleConfigurado = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const facebookConfigurado = Boolean(
  process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
)

// O login de demonstração existe só para permitir rodar o app localmente
// antes de configurar credenciais reais do Google/Facebook (que exigem uma
// conta em console.cloud.google.com / developers.facebook.com — ver
// docs/DEPLOY.md). Ele é travado por duas condições ao mesmo tempo, para que
// nunca fique ligado sem querer em produção:
//   1. a variável de ambiente ALLOW_DEMO_LOGIN precisa ser "true";
//   2. o app não pode estar rodando com NODE_ENV=production.
const demoLoginHabilitado =
  process.env.ALLOW_DEMO_LOGIN === 'true' && process.env.NODE_ENV !== 'production'

export const providersDisponiveis = {
  google: googleConfigurado,
  facebook: facebookConfigurado,
  demo: demoLoginHabilitado,
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Sessões via JWT (cookie assinado) em vez de tabela no banco: é o modo
  // exigido pelo NextAuth quando um CredentialsProvider está presente, e
  // também reduz uma consulta ao banco a cada requisição autenticada.
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    ...(googleConfigurado
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Escopo mínimo por enquanto: só identidade. Escopos de
            // Calendário/Contatos/Fotos serão adicionados quando essas
            // integrações forem implementadas (ver docs/ROADMAP.md), e
            // sempre pedidos de forma explícita e incremental — nunca "tudo
            // de uma vez" no primeiro login.
            authorization: {
              params: { scope: 'openid email profile' },
            },
          }),
        ]
      : []),
    ...(facebookConfigurado
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(demoLoginHabilitado
      ? [
          CredentialsProvider({
            id: 'demo',
            name: 'Demonstração',
            credentials: {},
            async authorize() {
              // Sempre entra com o mesmo usuário fixo de demonstração,
              // criando-o se ainda não existir. Não há senha porque este
              // provedor só existe em desenvolvimento local.
              const usuario = await prisma.user.upsert({
                where: { email: 'demo@conexao.app' },
                update: {},
                create: { email: 'demo@conexao.app', name: 'Conta Demonstração' },
              })
              // O provedor de credenciais não passa pelo adapter (não existe
              // um "createUser" do NextAuth aqui), por isso garantimos as
              // categorias padrão diretamente, já com o id definitivo do
              // usuário (o upsert acima já terminou).
              await garantirCategoriasPadrao(usuario.id)
              return { id: usuario.id, name: usuario.name, email: usuario.email }
            },
          }),
        ]
      : []),
  ],
  // "events" (diferente de "callbacks") só dispara depois que o NextAuth já
  // terminou de falar com o adapter — por isso createUser aqui garante que
  // o usuário já existe de verdade no banco, com o id definitivo gerado
  // pelo Prisma. Chamar isso a partir do callback `signIn` (como esta linha
  // fazia antes) causava erro: para contas novas via Google/Facebook, o
  // `user.id` recebido ali ainda não corresponde a uma linha persistida,
  // e a criação das categorias violava a chave estrangeira.
  events: {
    async createUser({ user }) {
      await garantirCategoriasPadrao(user.id)
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
