import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { CabecalhoApp } from '@/components/CabecalhoApp'
import { FormularioPessoa } from '@/components/FormularioPessoa'
import { Botao } from '@/components/ui/Botao'
import { Cartao } from '@/components/ui/Cartao'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function PaginaNovaPessoa() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const categorias = await prisma.categoria.findMany({
    where: { userId: session.user.id },
    orderBy: { ordem: 'asc' },
    select: { id: true, nome: true, icone: true },
  })

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-xl">Nova pessoa</h1>
          <Link href="/pessoas/importar">
            <Botao variante="secundario" tamanho="sm">
              Importar do Google Contatos
            </Botao>
          </Link>
        </div>
        <Cartao className="p-6">
          <FormularioPessoa categorias={categorias} />
        </Cartao>
      </main>
    </div>
  )
}
