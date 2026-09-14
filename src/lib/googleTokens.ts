// ============================================================================
// Gerenciamento de tokens OAuth do Google, compartilhado por todas as
// integrações (Calendário, Contatos, e futuramente Fotos — ver
// docs/ROADMAP.md). Os tokens ficam guardados na tabela de contas OAuth
// (Account/"contas_oauth"), gerenciada pelo PrismaAdapter do NextAuth — este
// módulo só lê e renova, nunca duplica esse armazenamento.
// ============================================================================

import { prisma } from '@/lib/prisma'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

// Margem de segurança: renova o token um pouco antes de expirar de verdade,
// para não correr o risco de uma chamada à API do Google falhar por poucos
// segundos de diferença de relógio.
const MARGEM_EXPIRACAO_SEGUNDOS = 60

/**
 * Devolve um access_token do Google válido para este usuário, renovando-o
 * sozinho (via refresh_token) se tiver expirado. Devolve `null` se o
 * usuário não conectou o Google, ou se o token expirou sem um
 * refresh_token disponível para renovar (conta conectada antes de
 * pedirmos "access_type=offline" — precisa sair e entrar de novo).
 */
export async function obterAccessTokenGoogleValido(userId: string): Promise<string | null> {
  const conta = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
  })
  if (!conta?.access_token) return null

  const agoraEmSegundos = Math.floor(Date.now() / 1000)
  const aindaValido = conta.expires_at && conta.expires_at - MARGEM_EXPIRACAO_SEGUNDOS > agoraEmSegundos
  if (aindaValido) return conta.access_token

  if (!conta.refresh_token) {
    return null
  }

  const resposta = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: conta.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!resposta.ok) {
    console.error('Falha ao renovar token de acesso do Google:', await resposta.text())
    return null
  }

  const dados = (await resposta.json()) as { access_token: string; expires_in: number }

  await prisma.account.update({
    where: { id: conta.id },
    data: {
      access_token: dados.access_token,
      expires_at: agoraEmSegundos + dados.expires_in,
    },
  })

  return dados.access_token
}
