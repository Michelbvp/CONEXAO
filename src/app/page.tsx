import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { CabecalhoApp } from '@/components/CabecalhoApp'
import { PessoaCard } from '@/components/PessoaCard'
import { authOptions } from '@/lib/auth'
import { sincronizarSugestoesDoUsuario } from '@/lib/cadencia'
import { obterDashboard } from '@/lib/dashboard'
import { garantirCategoriasPadrao } from '@/lib/onboarding'

export default async function PaginaInicial() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  // Rede de segurança idempotente: se por qualquer motivo o usuário chegou
  // até aqui sem as categorias padrão (ex.: um erro no meio do primeiro
  // login), cria agora em vez de deixar o painel vazio. É seguro chamar
  // sempre — a função já não faz nada se as categorias já existirem.
  await garantirCategoriasPadrao(session.user.id)

  // Gera sugestões pendentes que ainda não existem antes de montar a tela
  // (o job diário em src/app/api/cron/sugestoes/route.ts cobre os dias em
  // que o usuário não abre o app — os dois convivem sem duplicar nada).
  await sincronizarSugestoesDoUsuario(session.user.id)
  const categorias = await obterDashboard(session.user.id)

  const totalPessoas = categorias.reduce((soma, c) => soma + c.pessoas.length, 0)

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {totalPessoas === 0 ? (
          <EstadoVazio />
        ) : (
          <div className="flex flex-col gap-10">
            {categorias.map((categoria) => (
              <section key={categoria.id}>
                <h2 className="mb-4 text-lg">
                  <span className="mr-2">{categoria.icone}</span>
                  {categoria.nome}
                  <span className="ml-2 text-sm font-normal text-prata-500">
                    {categoria.pessoas.length}
                  </span>
                </h2>
                {categoria.pessoas.length === 0 ? (
                  <p className="text-sm text-prata-500">Nenhuma pessoa nesta categoria ainda.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {categoria.pessoas.map((pessoa) => (
                      <PessoaCard key={pessoa.id} pessoa={pessoa} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function EstadoVazio() {
  return (
    <div className="rounded-2xl border border-dashed border-prata-300 bg-white p-10 text-center">
      <h2 className="text-lg">Comece cadastrando alguém importante</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-prata-600">
        Adicione um mentor, um colega de trabalho ou alguém da família e o
        Conexão vai te ajudar a lembrar de manter contato.
      </p>
    </div>
  )
}
