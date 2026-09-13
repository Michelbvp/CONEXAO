import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { obterUserIdOuNulo, respostaNaoAutenticado } from '@/lib/sessao'
import { criarPessoaSchema } from '@/lib/validacao'

export async function GET() {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const pessoas = await prisma.pessoa.findMany({
    where: { userId, arquivadoEm: null },
    orderBy: { nome: 'asc' },
    include: { categoria: true },
  })
  return NextResponse.json(pessoas)
}

export async function POST(request: NextRequest) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const corpo = await request.json()
  const resultado = criarPessoaSchema.safeParse(corpo)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const dados = resultado.data

  // Garante que a categoria informada pertence de fato ao usuário logado —
  // sem essa checagem, um usuário mal-intencionado poderia tentar associar
  // uma pessoa a uma categoria de outra conta (IDOR - OWASP A01).
  const categoria = await prisma.categoria.findFirst({
    where: { id: dados.categoriaId, userId },
  })
  if (!categoria) {
    return NextResponse.json({ erro: 'Categoria inválida.' }, { status: 400 })
  }

  const pessoa = await prisma.pessoa.create({
    data: {
      userId,
      nome: dados.nome,
      categoriaId: dados.categoriaId,
      email: dados.email || null,
      telefone: dados.telefone || null,
      notas: dados.notas || null,
      cadenciaDiasPersonalizada: dados.cadenciaDiasPersonalizada ?? null,
    },
  })

  return NextResponse.json(pessoa, { status: 201 })
}
