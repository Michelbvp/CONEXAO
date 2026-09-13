import { NextRequest, NextResponse } from 'next/server'

import { sincronizarComGoogleCalendar } from '@/lib/googleCalendar'
import { prisma } from '@/lib/prisma'
import { DURACAO_MINUTOS_TIPO_CONTATO, ROTULO_TIPO_CONTATO } from '@/lib/rotulos'
import { obterUserIdOuNulo, respostaNaoAutenticado, respostaNaoEncontrado } from '@/lib/sessao'
import { responderSugestaoSchema } from '@/lib/validacao'

/**
 * Confirma ou recusa uma sugestão de contato.
 *
 * Este é o único lugar do app onde uma sugestão vira, de fato, um contato
 * agendado/registrado — e só acontece por uma ação explícita do usuário
 * (nunca automaticamente), conforme pedido no produto.
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

  const dataDoContato = resultado.data.dataHora ?? new Date()

  // Confirmar: cria a interação de verdade e fecha a sugestão, dentro de
  // uma transação para nunca deixar os dois fora de sincronia.
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
  const tituloEvento = `${ROTULO_TIPO_CONTATO[sugestao.tipoSugerido]} com ${sugestao.pessoa.nome}`
  const resultadoCalendario = await sincronizarComGoogleCalendar(userId, {
    titulo: tituloEvento,
    descricao: 'Contato agendado pelo Conexão.',
    inicio: dataDoContato,
    fimEmMinutos: DURACAO_MINUTOS_TIPO_CONTATO[sugestao.tipoSugerido],
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
