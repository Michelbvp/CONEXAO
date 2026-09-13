import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { CabecalhoApp } from '@/components/CabecalhoApp'
import { FormularioCategoria } from '@/components/FormularioCategoria'
import { Cartao } from '@/components/ui/Cartao'
import { authOptions } from '@/lib/auth'

export default async function PaginaNovaCategoria() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl">Nova categoria</h1>
        <Cartao className="p-6">
          <FormularioCategoria />
        </Cartao>
      </main>
    </div>
  )
}
