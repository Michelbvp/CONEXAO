import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BotaoExcluirCategoria } from '@/components/BotaoExcluirCategoria'
import { CabecalhoApp } from '@/components/CabecalhoApp'
import { Botao } from '@/components/ui/Botao'
import { Cartao } from '@/components/ui/Cartao'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ICONE_TIPO_CONTATO, ROTULO_TIPO_CONTATO, parseTiposPreferidos } from '@/lib/rotulos'

export default async function PaginaCategorias() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const categorias = await prisma.categoria.findMany({
    where: { userId: session.user.id },
    orderBy: { ordem: 'asc' },
    include: { _count: { select: { pessoas: { where: { arquivadoEm: null } } } } },
  })

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl">Categorias</h1>
            <p className="mt-1 text-sm text-prata-600">
              Ajuste o nome, o ícone, a cadência padrão de contato e os tipos de contato preferidos de cada
              categoria.
            </p>
          </div>
          <Link href="/categorias/novo" className="shrink-0">
            <Botao tamanho="sm">+ Nova categoria</Botao>
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {categorias.map((categoria) => {
            const tipos = parseTiposPreferidos(categoria.tiposPreferidos)
            return (
              <Cartao key={categoria.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base">
                      {categoria.icone} {categoria.nome}
                    </h2>
                    <p className="mt-1 text-sm text-prata-600">
                      Sugestão a cada {categoria.cadenciaDiasPadrao} dias · {categoria._count.pessoas}{' '}
                      {categoria._count.pessoas === 1 ? 'pessoa' : 'pessoas'}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-grafite-700">
                      {tipos.map((tipo) => (
                        <span key={tipo}>
                          {ICONE_TIPO_CONTATO[tipo]} {ROTULO_TIPO_CONTATO[tipo]}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link href={`/categorias/${categoria.id}/editar`}>
                      <Botao variante="secundario" tamanho="sm">
                        Editar
                      </Botao>
                    </Link>
                    <BotaoExcluirCategoria categoriaId={categoria.id} nome={categoria.nome} />
                  </div>
                </div>
              </Cartao>
            )
          })}
        </div>
      </main>
    </div>
  )
}
