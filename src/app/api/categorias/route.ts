import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { obterUserIdOuNulo, respostaNaoAutenticado } from '@/lib/sessao'
import { criarCategoriaSchema } from '@/lib/validacao'

export async function GET() {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const categorias = await prisma.categoria.findMany({
    where: { userId },
    orderBy: { ordem: 'asc' },
  })
  return NextResponse.json(categorias)
}

export async function POST(request: NextRequest) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const corpo = await request.json()
  const resultado = criarCategoriaSchema.safeParse(corpo)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const dados = resultado.data

  const existente = await prisma.categoria.findUnique({
    where: { userId_nome: { userId, nome: dados.nome } },
  })
  if (existente) {
    return NextResponse.json({ erro: 'Você já tem uma categoria com esse nome.' }, { status: 400 })
  }

  // Nova categoria entra no fim da lista.
  const totalAtual = await prisma.categoria.count({ where: { userId } })

  const categoria = await prisma.categoria.create({
    data: {
      userId,
      nome: dados.nome,
      icone: dados.icone || '👤',
      cadenciaDiasPadrao: dados.cadenciaDiasPadrao,
      tiposPreferidos: dados.tiposPreferidos.join(','),
      ordem: totalAtual,
    },
  })

  return NextResponse.json(categoria, { status: 201 })
}
