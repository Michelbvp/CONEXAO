import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { obterUserIdOuNulo, respostaNaoAutenticado, respostaNaoEncontrado } from '@/lib/sessao'
import { atualizarPessoaSchema } from '@/lib/validacao'

async function buscarPessoaDoUsuario(id: string, userId: string) {
  return prisma.pessoa.findFirst({ where: { id, userId } })
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const { id } = await params
  const pessoa = await prisma.pessoa.findFirst({
    where: { id, userId },
    include: {
      categoria: true,
      interacoes: { orderBy: { data: 'desc' } },
      sugestoes: { where: { status: 'PENDENTE' } },
    },
  })
  if (!pessoa) return respostaNaoEncontrado('Pessoa não encontrada.')
  return NextResponse.json(pessoa)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const { id } = await params
  const existente = await buscarPessoaDoUsuario(id, userId)
  if (!existente) return respostaNaoEncontrado('Pessoa não encontrada.')

  const corpo = await request.json()
  const resultado = atualizarPessoaSchema.safeParse(corpo)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  }
  const dados = resultado.data

  if (dados.categoriaId) {
    const categoria = await prisma.categoria.findFirst({ where: { id: dados.categoriaId, userId } })
    if (!categoria) return NextResponse.json({ erro: 'Categoria inválida.' }, { status: 400 })
  }

  const pessoa = await prisma.pessoa.update({
    where: { id: existente.id },
    data: {
      ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
      ...(dados.categoriaId !== undefined ? { categoriaId: dados.categoriaId } : {}),
      ...(dados.email !== undefined ? { email: dados.email || null } : {}),
      ...(dados.telefone !== undefined ? { telefone: dados.telefone || null } : {}),
      ...(dados.notas !== undefined ? { notas: dados.notas || null } : {}),
      ...(dados.cadenciaDiasPersonalizada !== undefined
        ? { cadenciaDiasPersonalizada: dados.cadenciaDiasPersonalizada }
        : {}),
      ...(dados.arquivar !== undefined ? { arquivadoEm: dados.arquivar ? new Date() : null } : {}),
    },
  })

  return NextResponse.json(pessoa)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  const { id } = await params
  const existente = await buscarPessoaDoUsuario(id, userId)
  if (!existente) return respostaNaoEncontrado('Pessoa não encontrada.')

  // Exclusão é "suave" (arquivamento) por padrão no app, para não perder o
  // histórico de interações sem querer. Uma exclusão definitiva pode ser
  // feita direto no banco pelo próprio usuário, ou via exclusão de conta
  // (que aí sim remove tudo em cascata — ver /api/conta).
  await prisma.pessoa.update({ where: { id: existente.id }, data: { arquivadoEm: new Date() } })

  return new NextResponse(null, { status: 204 })
}
