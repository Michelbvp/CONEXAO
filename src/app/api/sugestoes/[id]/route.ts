import { NextRequest, NextResponse } from 'next/server'

import { sincronizarComGoogleCalendar } from '@/lib/googleCalendar'
import { prisma } from '@/lib/prisma'
import { DURACAO_MINUTOS_TIPO_CONTATO, ROTULO_TIPO_CONTATO } from '@/lib/rotulos'
import { obterUserIdOuNulo, respostaNaoAutenticado, respostaNaoEncontrado } from '@/lib/sessao'
import { responderSugestaoSchema } from '@/lib/validacao'

/**
 * Confirma ou recusa uma sugestão de contato.
 *
 * Confirmar com uma data/horário no FUTURO cria um Agendamento (fica
 * "ativo", esperando o usuário dizer depois se o contato foi realizado,
 * cancelado ou precisa ser reagendado — ver /api/agendamentos/[id]).
 * Confirmar para agora (ou uma data passada) registra o contato
 * diretamente no histórico, como já acontecia antes do agendamento
 * existir. Em nenhum dos dois casos nada é decidido pelo app sozinho.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const corpo = await request.json()
  const resultado = responderSugestaoSchema.safeParse(corpo)
  if (!resultado.success) {
    return NextResponse.json({ erro: 'Ação inválida.' }, { status: 400 })
  }

  const { id } = await params
  const sugestao = await prisma.sugestao.findFirst({
    where: { id, status: 'PENDENTE', pessoa: { userId } },
    include: { pessoa: { select: { nome: true } } },
  })
  if (!sugestao) return respostaNaoEncontrado('Sugestão não encontrada ou já respondida.')

  if (resultado.data.acao === 'recusar') {
    const atualizada = await prisma.sugestao.update({
      where: { id: sugestao.id },
      data: { status: 'RECUSADA', respondidoEm: new Date() },
    })
    return NextResponse.json(atualizada)
  }

  const agora = new Date()
  const dataDoContato = resultado.data.dataHora ?? agora
  const ehAgendamentoFuturo = dataDoContato.getTime() > agora.getTime()

  const tituloEvento = `${ROTULO_TIPO_CONTATO[sugestao.tipoSugerido]} com ${sugestao.pessoa.nome}`
  const duracaoMinutos = DURACAO_MINUTOS_TIPO_CONTATO[sugestao.tipoSugerido]

  if (ehAgendamentoFuturo) {
    const [agendamento, sugestaoAtualizada] = await prisma.$transaction(async (tx) => {
      const novoAgendamento = await tx.agendamento.create({
        data: {
          pessoaId: sugestao.pessoaId,
          tipo: sugestao.tipoSugerido,
          dataHora: dataDoContato,
        },
      })
      const sugestaoAtualizada = await tx.sugestao.update({
        where: { id: sugestao.id },
        data: { status: 'CONFIRMADA', respondidoEm: new Date() },
      })
      return [novoAgendamento, sugestaoAtualizada] as const
    })

    const resultadoCalendario = await sincronizarComGoogleCalendar(userId, {
      titulo: tituloEvento,
      descricao: 'Agendado pelo Conexão.',
      inicio: dataDoContato,
      fimEmMinutos: duracaoMinutos,
    })

    let agendamentoFinal = agendamento
    if (resultadoCalendario.status === 'sucesso') {
      agendamentoFinal = await prisma.agendamento.update({
        where: { id: agendamento.id },
        data: { googleEventId: resultadoCalendario.eventId, googleEventLink: resultadoCalendario.eventLink },
      })
    }

    return NextResponse.json({
      agendamento: agendamentoFinal,
      sugestao: sugestaoAtualizada,
      googleCalendar: resultadoCalendario.status,
    })
  }

  // Confirmar para agora/passado: cria a interação de verdade e fecha a
  // sugestão, dentro de uma transação para nunca deixar os dois fora de
  // sincronia.
  const [interacao, sugestaoAtualizada] = await prisma.$transaction(async (tx) => {
    const novaInteracao = await tx.interacao.create({
      data: {
        pessoaId: sugestao.pessoaId,
        tipo: sugestao.tipoSugerido,
        data: dataDoContato,
        origem: 'SUGESTAO_CONFIRMADA',
      },
    })
    const sugestaoAtualizada = await tx.sugestao.update({
      where: { id: sugestao.id },
      data: { status: 'CONFIRMADA', respondidoEm: new Date(), interacaoGeradaId: novaInteracao.id },
    })
    return [novaInteracao, sugestaoAtualizada] as const
  })

  // Sincroniza com o Google Calendário DEPOIS de confirmar no banco — é uma
  // chamada de rede (não deve ficar dentro da transação) e, se falhar, o
  // contato já está registrado mesmo assim (ver sincronizarComGoogleCalendar).
  const resultadoCalendario = await sincronizarComGoogleCalendar(userId, {
    titulo: tituloEvento,
    descricao: 'Contato registrado pelo Conexão.',
    inicio: dataDoContato,
    fimEmMinutos: duracaoMinutos,
  })

  let interacaoFinal = interacao
  if (resultadoCalendario.status === 'sucesso') {
    interacaoFinal = await prisma.interacao.update({
      where: { id: interacao.id },
      data: { googleEventId: resultadoCalendario.eventId, googleEventLink: resultadoCalendario.eventLink },
    })
  }

  return NextResponse.json({
    interacao: interacaoFinal,
    sugestao: sugestaoAtualizada,
    googleCalendar: resultadoCalendario.status,
  })
}
