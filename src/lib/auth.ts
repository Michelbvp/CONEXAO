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
            authorization: {
              params: {
                // Cada escopo é o mais restrito que o Google oferece para a
                // funcionalidade correspondente: calendar.events só dá
                // acesso a eventos (não à agenda inteira), e
                // contacts.readonly só permite LER contatos — o app nunca
                // cria/altera/apaga nada no Google Contatos, só lista pra
                // o usuário escolher quem importar (ver
                // src/lib/googleContacts.ts). Fotos ainda não é pedido — só
                // entra quando essa integração for implementada (ver
                // docs/ROADMAP.md), sempre de forma incremental.
                scope:
                  'openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/contacts.readonly',
                // access_type=offline + prompt=consent são o que faz o
                // Google devolver um refresh_token (sem isso, o app só
                // ganha um access_token que expira em ~1h e não tem como
                // renovar sozinho depois). O efeito colateral é a tela de
                // consentimento do Google aparecer a cada novo login — uma
                // troca aceitável pela integração funcionar de verdade.
                access_type: 'offline',
                prompt: 'consent',
              },
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
    // O NextAuth só grava os tokens de uma conta OAuth (tabela
    // "contas_oauth") na primeira vez que ela é vinculada a um usuário —
    // em logins seguintes, mesmo que o Google conceda um escopo NOVO (como
    // o do Calendário, adicionado depois que contas já existiam), os
    // tokens antigos e incompletos continuavam parados no banco, sem
    // access_token/refresh_token do Calendário. Por isso atualizamos
    // sempre, a cada login, com os tokens desta sessão — updateMany não
    // faz nada se a conta ainda não existir (linkAccount acabou de criá-la
    // com os mesmos valores, então é seguro e idempotente).
    async signIn({ account }) {
      if (account && (account.provider === 'google' || account.provider === 'facebook')) {
        await prisma.account.updateMany({
          where: { provider: account.provider, providerAccountId: account.providerAccountId },
          data: {
            access_token: account.access_token,
            // Só sobrescreve o refresh_token quando um novo vier — o Google
            // nem sempre reenvia um em cada login, e não queremos apagar um
            // refresh_token válido que já tínhamos guardado.
            ...(account.refresh_token ? { refresh_token: account.refresh_token } : {}),
            expires_at: account.expires_at,
            scope: account.scope,
            token_type: account.token_type,
            id_token: account.id_token,
          },
        })
      }
      return true
    },
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
