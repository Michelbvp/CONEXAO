import { NextRequest, NextResponse } from 'next/server'

import { atualizarEventoNoGoogleCalendar, removerEventoDoGoogleCalendar } from '@/lib/googleCalendar'
import { prisma } from '@/lib/prisma'
import { DURACAO_MINUTOS_TIPO_CONTATO } from '@/lib/rotulos'
import { obterUserIdOuNulo, respostaNaoAutenticado, respostaNaoEncontrado } from '@/lib/sessao'
import { responderAgendamentoSchema } from '@/lib/validacao'

/**
 * Resolve um agendamento pendente: marca como realizado (cria a interação
 * de verdade no histórico), cancela (fecha aqui mesmo, sem virar
 * interação) ou reagenda (só muda a data/horário, continua AGENDADO).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const corpo = await request.json()
  const resultado = responderAgendamentoSchema.safeParse(corpo)
  if (!resultado.success) {
    return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
  }
  const { acao, dataHora } = resultado.data

  const { id } = await params
  const agendamento = await prisma.agendamento.findFirst({
    where: { id, status: 'AGENDADO', pessoa: { userId } },
  })
  if (!agendamento) return respostaNaoEncontrado('Agendamento não encontrado ou já resolvido.')

  if (acao === 'cancelar') {
    const atualizado = await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: 'CANCELADO' },
    })
    if (agendamento.googleEventId) {
      await removerEventoDoGoogleCalendar(userId, agendamento.googleEventId)
    }
    return NextResponse.json({ agendamento: atualizado })
  }

  if (acao === 'reagendar') {
    if (!dataHora) {
      return NextResponse.json({ erro: 'Informe a nova data/horário.' }, { status: 400 })
    }
    const atualizado = await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { dataHora },
    })

    let googleCalendar: string = 'sem_google'
    if (agendamento.googleEventId) {
      const resultadoCalendario = await atualizarEventoNoGoogleCalendar(userId, agendamento.googleEventId, {
        inicio: dataHora,
        fimEmMinutos: DURACAO_MINUTOS_TIPO_CONTATO[agendamento.tipo],
      })
      googleCalendar = resultadoCalendario.status
    }

    return NextResponse.json({ agendamento: atualizado, googleCalendar })
  }

  // acao === 'realizado': cria a interação de verdade e fecha o agendamento.
  const [interacao, agendamentoAtualizado] = await prisma.$transaction(async (tx) => {
    const novaInteracao = await tx.interacao.create({
      data: {
        pessoaId: agendamento.pessoaId,
        tipo: agendamento.tipo,
        data: agendamento.dataHora,
        origem: 'AGENDAMENTO_REALIZADO',
        googleEventId: agendamento.googleEventId,
        googleEventLink: agendamento.googleEventLink,
      },
    })
    const agendamentoAtualizado = await tx.agendamento.update({
      where: { id: agendamento.id },
      data: { status: 'REALIZADO', interacaoGeradaId: novaInteracao.id },
    })
    return [novaInteracao, agendamentoAtualizado] as const
  })

  return NextResponse.json({ interacao, agendamento: agendamentoAtualizado })
}
