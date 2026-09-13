// ============================================================================
// Integração com o Google Calendário.
// ----------------------------------------------------------------------------
// Usada só num momento: ao confirmar uma sugestão de contato (ver
// src/app/api/sugestoes/[id]/route.ts), cria um evento no calendário
// principal do usuário. Se o usuário não conectou o Google, ou se qualquer
// chamada aqui falhar, a confirmação do contato continua funcionando
// normalmente — essa integração é um "extra", nunca um bloqueio.
//
// Os tokens de acesso do Google ficam guardados na tabela de contas OAuth
// (Account/"contas_oauth"), gerenciada pelo PrismaAdapter do NextAuth — não
// duplicamos esse armazenamento aqui. Access tokens do Google expiram em
// ~1h, então esse módulo cuida de renová-los sozinho usando o
// refresh_token, que só existe porque pedimos "access_type=offline" no
// login (ver src/lib/auth.ts).
// ============================================================================

import { prisma } from '@/lib/prisma'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

// Margem de segurança: renova o token um pouco antes de expirar de verdade,
// para não correr o risco de uma chamada à API do Google falhar por poucos
// segundos de diferença de relógio.
const MARGEM_EXPIRACAO_SEGUNDOS = 60

async function obterAccessTokenGoogleValido(userId: string): Promise<string | null> {
  const conta = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
  })
  if (!conta?.access_token) return null

  const agoraEmSegundos = Math.floor(Date.now() / 1000)
  const aindaValido = conta.expires_at && conta.expires_at - MARGEM_EXPIRACAO_SEGUNDOS > agoraEmSegundos
  if (aindaValido) return conta.access_token

  if (!conta.refresh_token) {
    // Token expirado e sem refresh_token para renovar — provavelmente uma
    // conta conectada antes de pedirmos "access_type=offline". O usuário
    // precisa sair e entrar de novo com o Google para reconectar.
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
    console.error('Falha ao renovar token do Google Calendário:', await resposta.text())
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

export type ResultadoSincronizacaoCalendario =
  | { status: 'sem_google' }
  | { status: 'sucesso'; eventId: string; eventLink: string }
  | { status: 'erro'; motivo: string }

/**
 * Cria um evento no Google Calendário principal do usuário. Nunca lança
 * exceção — qualquer problema (usuário sem Google conectado, token
 * inválido, API do Google fora do ar) volta como `{ status: 'erro' | 'sem_google' }`
 * para quem chamou decidir o que mostrar, sem travar o fluxo de confirmar
 * um contato.
 */
export async function sincronizarComGoogleCalendar(
  userId: string,
  evento: { titulo: string; descricao?: string; inicio: Date; fimEmMinutos: number },
): Promise<ResultadoSincronizacaoCalendario> {
  try {
    const accessToken = await obterAccessTokenGoogleValido(userId)
    if (!accessToken) return { status: 'sem_google' }

    const fim = new Date(evento.inicio.getTime() + evento.fimEmMinutos * 60_000)

    const resposta = await fetch(GOOGLE_CALENDAR_EVENTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: evento.titulo,
        description: evento.descricao,
        start: { dateTime: evento.inicio.toISOString(), timeZone: 'UTC' },
        end: { dateTime: fim.toISOString(), timeZone: 'UTC' },
      }),
    })

    if (!resposta.ok) {
      const corpo = await resposta.text()
      console.error('Falha ao criar evento no Google Calendário:', resposta.status, corpo)
      return { status: 'erro', motivo: `Google respondeu ${resposta.status}` }
    }

    const dados = (await resposta.json()) as { id: string; htmlLink: string }
    return { status: 'sucesso', eventId: dados.id, eventLink: dados.htmlLink }
  } catch (erro) {
    console.error('Erro inesperado ao sincronizar com o Google Calendário:', erro)
    return { status: 'erro', motivo: 'Erro inesperado' }
  }
}
