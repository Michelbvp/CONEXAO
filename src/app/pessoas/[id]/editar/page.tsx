import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'

import { CabecalhoApp } from '@/components/CabecalhoApp'
import { FormularioPessoa } from '@/components/FormularioPessoa'
import { Cartao } from '@/components/ui/Cartao'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function PaginaEditarPessoa({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { id } = await params
  const [pessoa, categorias] = await Promise.all([
    prisma.pessoa.findFirst({ where: { id, userId: session.user.id } }),
    prisma.categoria.findMany({
      where: { userId: session.user.id },
      orderBy: { ordem: 'asc' },
      select: { id: true, nome: true, icone: true },
    }),
  ])
  if (!pessoa) notFound()

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl">Editar pessoa</h1>
        <Cartao className="p-6">
          <FormularioPessoa
            categorias={categorias}
            pessoa={{
              id: pessoa.id,
              nome: pessoa.nome,
              categoriaId: pessoa.categoriaId,
              email: pessoa.email,
              telefone: pessoa.telefone,
              notas: pessoa.notas,
              cadenciaDiasPersonalizada: pessoa.cadenciaDiasPersonalizada,
            }}
          />
        </Cartao>
      </main>
    </div>
  )
}
