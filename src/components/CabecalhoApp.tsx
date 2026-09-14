import Link from 'next/link'
import { Session } from 'next-auth'

import { Avatar } from '@/components/ui/Avatar'
import { Botao } from '@/components/ui/Botao'
import { BotaoSair } from '@/components/BotaoSair'

export function CabecalhoApp({ session }: { session: Session }) {
  return (
    <header className="border-b border-prata-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight text-grafite-950">
          Conexão
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/agenda">
            <Botao variante="fantasma" tamanho="sm">
              Agenda
            </Botao>
          </Link>
          <Link href="/categorias">
            <Botao variante="fantasma" tamanho="sm">
              Categorias
            </Botao>
          </Link>
          <Link href="/pessoas/novo">
            <Botao tamanho="sm">+ Nova pessoa</Botao>
          </Link>
          <Avatar nome={session.user?.name ?? session.user?.email ?? '?'} fotoUrl={session.user?.image} tamanho={32} />
          <BotaoSair />
        </div>
      </div>
    </header>
  )
}
