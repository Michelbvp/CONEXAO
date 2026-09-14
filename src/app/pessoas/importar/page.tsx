import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { CabecalhoApp } from '@/components/CabecalhoApp'
import { ImportarContatosGoogle } from '@/components/ImportarContatosGoogle'
import { Cartao } from '@/components/ui/Cartao'
import { authOptions } from '@/lib/auth'
import { listarContatosGoogle } from '@/lib/googleContacts'
import { prisma } from '@/lib/prisma'

export default async function PaginaImportarContatos() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const [categorias, pessoasJaLigadas, resultado] = await Promise.all([
    prisma.categoria.findMany({
      where: { userId: session.user.id },
      orderBy: { ordem: 'asc' },
      select: { id: true, nome: true, icone: true },
    }),
    prisma.pessoa.findMany({
      where: { userId: session.user.id, googleContactId: { not: null } },
      select: { googleContactId: true },
    }),
    listarContatosGoogle(session.user.id),
  ])

  const idsJaImportados = new Set(pessoasJaLigadas.map((p) => p.googleContactId))
  const contatosParaSugerir =
    resultado.status === 'sucesso'
      ? resultado.contatos.filter((contato) => !idsJaImportados.has(contato.resourceName))
      : []

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-xl">Importar do Google Contatos</h1>
        <p className="mb-6 text-sm text-prata-500">
          Escolha quem você quer trazer para o Conexão. Ninguém é importado automaticamente.
        </p>

        {resultado.status === 'sem_google' && (
          <Cartao className="p-6 text-sm text-grafite-700">
            Sua conta não está conectada ao Google, ou você entrou antes de o Conexão pedir acesso
            aos contatos. Saia e entre novamente com o Google para poder importar seus contatos.
          </Cartao>
        )}

        {resultado.status === 'erro' && (
          <Cartao className="p-6 text-sm text-grafite-700">
            Não foi possível conversar com o Google Contatos agora ({resultado.motivo}). Tente
            novamente em alguns instantes.
          </Cartao>
        )}

        {resultado.status === 'sucesso' && (
          <ImportarContatosGoogle contatos={contatosParaSugerir} categorias={categorias} />
        )}
      </main>
    </div>
  )
}
