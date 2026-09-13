import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'

import { CabecalhoApp } from '@/components/CabecalhoApp'
import { FormularioCategoria } from '@/components/FormularioCategoria'
import { Cartao } from '@/components/ui/Cartao'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTiposPreferidos } from '@/lib/rotulos'

export default async function PaginaEditarCategoria({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { id } = await params
  const categoria = await prisma.categoria.findFirst({ where: { id, userId: session.user.id } })
  if (!categoria) notFound()

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl">Editar categoria</h1>
        <Cartao className="p-6">
          <FormularioCategoria
            categoria={{
              id: categoria.id,
              nome: categoria.nome,
              icone: categoria.icone,
              cadenciaDiasPadrao: categoria.cadenciaDiasPadrao,
              tiposPreferidos: parseTiposPreferidos(categoria.tiposPreferidos),
            }}
          />
        </Cartao>
      </main>
    </div>
  )
}
