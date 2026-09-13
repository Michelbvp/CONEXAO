import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { obterUserIdOuNulo, respostaNaoAutenticado, respostaNaoEncontrado } from '@/lib/sessao'
import { criarInteracaoSchema } from '@/lib/validacao'

export async function POST(request: NextRequest) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const corpo = await request.json()
  const resultado = criarInteracaoSchema.safeParse(corpo)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const dados = resultado.data

  const pessoa = await prisma.pessoa.findFirst({ where: { id: dados.pessoaId, userId } })
  if (!pessoa) return respostaNaoEncontrado('Pessoa não encontrada.')

  const interacao = await prisma.interacao.create({
    data: {
      pessoaId: pessoa.id,
      tipo: dados.tipo,
      data: dados.data ?? new Date(),
      nota: dados.nota || null,
      origem: 'MANUAL',
    },
  })

  return NextResponse.json(interacao, { status: 201 })
}
