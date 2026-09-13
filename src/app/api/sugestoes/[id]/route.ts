import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
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
  })
  if (!sugestao) return respostaNaoEncontrado('Sugestão não encontrada ou já respondida.')

  if (resultado.data.acao === 'recusar') {
    const atualizada = await prisma.sugestao.update({
      where: { id: sugestao.id },
      data: { status: 'RECUSADA', respondidoEm: new Date() },
    })
    return NextResponse.json(atualizada)
  }

  // Confirmar: cria a interação de verdade e fecha a sugestão, dentro de
  // uma transação para nunca deixar os dois fora de sincronia.
  const [interacao, sugestaoAtualizada] = await prisma.$transaction(async (tx) => {
    const novaInteracao = await tx.interacao.create({
      data: {
        pessoaId: sugestao.pessoaId,
        tipo: sugestao.tipoSugerido,
        data: new Date(),
        origem: 'SUGESTAO_CONFIRMADA',
      },
    })
    const sugestaoAtualizada = await tx.sugestao.update({
      where: { id: sugestao.id },
      data: { status: 'CONFIRMADA', respondidoEm: new Date(), interacaoGeradaId: novaInteracao.id },
    })
    return [novaInteracao, sugestaoAtualizada] as const
  })

  return NextResponse.json({ interacao, sugestao: sugestaoAtualizada })
}
