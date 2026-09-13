import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { obterUserIdOuNulo, respostaNaoAutenticado, respostaNaoEncontrado } from '@/lib/sessao'
import { atualizarCategoriaSchema } from '@/lib/validacao'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const { id } = await params
  const existente = await prisma.categoria.findFirst({ where: { id, userId } })
  if (!existente) return respostaNaoEncontrado('Categoria não encontrada.')

  const corpo = await request.json()
  const resultado = atualizarCategoriaSchema.safeParse(corpo)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const dados = resultado.data

  if (dados.nome && dados.nome !== existente.nome) {
    const duplicada = await prisma.categoria.findUnique({
      where: { userId_nome: { userId, nome: dados.nome } },
    })
    if (duplicada) {
      return NextResponse.json({ erro: 'Você já tem uma categoria com esse nome.' }, { status: 400 })
    }
  }

  const categoria = await prisma.categoria.update({
    where: { id: existente.id },
    data: {
      ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
      ...(dados.icone !== undefined ? { icone: dados.icone || '👤' } : {}),
      ...(dados.cadenciaDiasPadrao !== undefined ? { cadenciaDiasPadrao: dados.cadenciaDiasPadrao } : {}),
      ...(dados.tiposPreferidos !== undefined ? { tiposPreferidos: dados.tiposPreferidos.join(',') } : {}),
    },
  })

  return NextResponse.json(categoria)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const { id } = await params
  const existente = await prisma.categoria.findFirst({ where: { id, userId } })
  if (!existente) return respostaNaoEncontrado('Categoria não encontrada.')

  const totalCategorias = await prisma.categoria.count({ where: { userId } })
  if (totalCategorias <= 1) {
    return NextResponse.json(
      { erro: 'Você precisa ter pelo menos uma categoria — crie outra antes de excluir esta.' },
      { status: 400 },
    )
  }

  // Pessoa.categoriaId é obrigatório (sem exclusão em cascata de propósito:
  // apagar uma categoria nunca deve apagar pessoas). Por isso bloqueamos a
  // exclusão enquanto houver alguém — arquivado ou não — nela.
  const pessoasNaCategoria = await prisma.pessoa.count({ where: { categoriaId: id } })
  if (pessoasNaCategoria > 0) {
    return NextResponse.json(
      {
        erro: `Não é possível excluir: ${pessoasNaCategoria} pessoa(s) ainda estão nesta categoria. Edite essas pessoas e mude a categoria delas antes.`,
      },
      { status: 400 },
    )
  }

  await prisma.categoria.delete({ where: { id: existente.id } })

  return new NextResponse(null, { status: 204 })
}
