import { NextRequest, NextResponse } from 'next/server'

import { sincronizarComGoogleCalendar } from '@/lib/googleCalendar'
import { prisma } from '@/lib/prisma'
import { DURACAO_MINUTOS_TIPO_CONTATO, ROTULO_TIPO_CONTATO } from '@/lib/rotulos'
import { obterUserIdOuNulo, respostaNaoAutenticado, respostaNaoEncontrado } from '@/lib/sessao'
import { criarInteracaoSchema } from '@/lib/validacao'

/**
 * Registra um contato manualmente. Segue a mesma regra do fluxo de
 * confirmar sugestão (ver /api/sugestoes/[id]): data/horário no FUTURO
 * cria um Agendamento (fica ativo até o usuário marcar como
 * realizado/reagendar/cancelar) em vez de ir direto pro histórico; para
 * agora/passado, registra a interação diretamente. Em ambos os casos,
 * sincroniza com o Google Calendário do usuário (se conectado).
 */
export async function POST(request: NextRequest) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const corpo = await request.json()
  const resultado = criarInteracaoSchema.safeParse(corpo)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const dados = resultado.data

  const pessoa = await prisma.pessoa.findFirst({
    where: { id: dados.pessoaId, userId },
    select: { id: true, nome: true },
  })
  if (!pessoa) return respostaNaoEncontrado('Pessoa não encontrada.')

  const agora = new Date()
  const dataDoContato = dados.data ?? agora
  const ehAgendamentoFuturo = dataDoContato.getTime() > agora.getTime()

  const tituloEvento = `${ROTULO_TIPO_CONTATO[dados.tipo]} com ${pessoa.nome}`
  const duracaoMinutos = DURACAO_MINUTOS_TIPO_CONTATO[dados.tipo]

  if (ehAgendamentoFuturo) {
    const agendamento = await prisma.agendamento.create({
      data: { pessoaId: pessoa.id, tipo: dados.tipo, dataHora: dataDoContato },
    })
    const resultadoCalendario = await sincronizarComGoogleCalendar(userId, {
      titulo: tituloEvento,
      descricao: 'Agendado pelo Conexão.',
      inicio: dataDoContato,
      fimEmMinutos: duracaoMinutos,
    })
    const agendamentoFinal =
      resultadoCalendario.status === 'sucesso'
        ? await prisma.agendamento.update({
            where: { id: agendamento.id },
            data: { googleEventId: resultadoCalendario.eventId, googleEventLink: resultadoCalendario.eventLink },
          })
        : agendamento

    return NextResponse.json(
      { agendamento: agendamentoFinal, googleCalendar: resultadoCalendario.status },
      { status: 201 },
    )
  }

  const interacao = await prisma.interacao.create({
    data: {
      pessoaId: pessoa.id,
      tipo: dados.tipo,
      data: dataDoContato,
      nota: dados.nota || null,
      origem: 'MANUAL',
    },
  })
  const resultadoCalendario = await sincronizarComGoogleCalendar(userId, {
    titulo: tituloEvento,
    descricao: 'Contato registrado pelo Conexão.',
    inicio: dataDoContato,
    fimEmMinutos: duracaoMinutos,
  })
  const interacaoFinal =
    resultadoCalendario.status === 'sucesso'
      ? await prisma.interacao.update({
          where: { id: interacao.id },
          data: { googleEventId: resultadoCalendario.eventId, googleEventLink: resultadoCalendario.eventLink },
        })
      : interacao

  return NextResponse.json({ interacao: interacaoFinal, googleCalendar: resultadoCalendario.status }, { status: 201 })
}
