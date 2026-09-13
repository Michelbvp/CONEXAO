import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { obterUserIdOuNulo, respostaNaoAutenticado } from '@/lib/sessao'

/**
 * Exclui definitivamente a conta do usuário e todos os dados associados
 * (pessoas, categorias, interações, sugestões, sessões).
 *
 * Implementa o direito de eliminação de dados pessoais da LGPD (art. 18,
 * VI, da Lei 13.709/2018): o próprio usuário pode apagar tudo o que
 * cadastrou, sem depender de suporte. A exclusão em cascata está definida
 * no schema do Prisma (onDelete: Cascade em cada relação com User), então
 * basta apagar o registro de User — ver docs/PRIVACIDADE.md.
 */
export async function DELETE() {
  const userId = await obterUserIdOuNulo()
  if (!userId) return respostaNaoAutenticado()

  await prisma.user.delete({ where: { id: userId } })

  return new NextResponse(null, { status: 204 })
}
