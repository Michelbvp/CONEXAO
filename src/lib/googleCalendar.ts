// ============================================================================
// Integração com o Google Calendário.
// ----------------------------------------------------------------------------
// Usada só num momento: ao confirmar/registrar um contato com data no
// presente/passado, ou ao agendar um contato futuro (ver
// src/app/api/interacoes/route.ts e src/app/api/sugestoes/[id]/route.ts),
// cria um evento no calendário principal do usuário. Se o usuário não
// conectou o Google, ou se qualquer chamada aqui falhar, o registro/
// agendamento continua funcionando normalmente — essa integração é um
// "extra", nunca um bloqueio.
// ============================================================================

import { obterAccessTokenGoogleValido } from '@/lib/googleTokens'

const GOOGLE_CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

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

/**
 * Atualiza a data/horário de um evento já existente (usado ao reagendar um
 * Agendamento). Best-effort como as demais funções deste módulo: uma falha
 * aqui nunca deve impedir o reagendamento em si dentro do app.
 */
export async function atualizarEventoNoGoogleCalendar(
  userId: string,
  eventId: string,
  evento: { inicio: Date; fimEmMinutos: number },
): Promise<ResultadoSincronizacaoCalendario> {
  try {
    const accessToken = await obterAccessTokenGoogleValido(userId)
    if (!accessToken) return { status: 'sem_google' }

    const fim = new Date(evento.inicio.getTime() + evento.fimEmMinutos * 60_000)

    const resposta = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: { dateTime: evento.inicio.toISOString(), timeZone: 'UTC' },
        end: { dateTime: fim.toISOString(), timeZone: 'UTC' },
      }),
    })

    if (!resposta.ok) {
      const corpo = await resposta.text()
      console.error('Falha ao atualizar evento no Google Calendário:', resposta.status, corpo)
      return { status: 'erro', motivo: `Google respondeu ${resposta.status}` }
    }

    const dados = (await resposta.json()) as { id: string; htmlLink: string }
    return { status: 'sucesso', eventId: dados.id, eventLink: dados.htmlLink }
  } catch (erro) {
    console.error('Erro inesperado ao atualizar evento no Google Calendário:', erro)
    return { status: 'erro', motivo: 'Erro inesperado' }
  }
}

/**
 * Remove um evento do Google Calendário (usado ao cancelar um
 * Agendamento). Best-effort: se falhar, o cancelamento no app acontece do
 * mesmo jeito — na pior das hipóteses, o evento fica "esquecido" na agenda
 * do usuário, que pode apagá-lo manualmente.
 */
export async function removerEventoDoGoogleCalendar(userId: string, eventId: string): Promise<void> {
  try {
    const accessToken = await obterAccessTokenGoogleValido(userId)
    if (!accessToken) return

    const resposta = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    // 410 (Gone) é esperado se o evento já tiver sido apagado antes — não é erro.
    if (!resposta.ok && resposta.status !== 410) {
      console.error('Falha ao remover evento do Google Calendário:', resposta.status, await resposta.text())
    }
  } catch (erro) {
    console.error('Erro inesperado ao remover evento do Google Calendário:', erro)
  }
}
