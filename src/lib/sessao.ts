import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth'

/**
 * Helper usado no início de toda rota de API que exige login. Devolve o id
 * do usuário autenticado, ou já retorna a resposta 401 pronta para a rota
 * repassar (`return naoAutenticado()` / checar `if (!userId) return erro`).
 */
export async function obterUserIdOuNulo(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

export function respostaNaoAutenticado() {
  return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
}

export function respostaNaoEncontrado(mensagem = 'Recurso não encontrado.') {
  return NextResponse.json({ erro: mensagem }, { status: 404 })
}
