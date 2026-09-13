import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AgendamentoAcoes } from '@/components/AgendamentoAcoes'
import { CabecalhoApp } from '@/components/CabecalhoApp'
import { Avatar } from '@/components/ui/Avatar'
import { Cartao } from '@/components/ui/Cartao'
import { authOptions } from '@/lib/auth'
import { dataParaDatetimeLocal } from '@/lib/formatacao'
import { prisma } from '@/lib/prisma'
import { ICONE_TIPO_CONTATO, ROTULO_TIPO_CONTATO } from '@/lib/rotulos'

const SETE_DIAS_EM_MS = 7 * 24 * 60 * 60 * 1000

export default async function PaginaAgenda() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const agora = new Date()
  const limite = new Date(agora.getTime() + SETE_DIAS_EM_MS)

  const agendamentos = await prisma.agendamento.findMany({
    where: { status: 'AGENDADO', pessoa: { userId: session.user.id, arquivadoEm: null } },
    include: { pessoa: { select: { id: true, nome: true, fotoUrl: true } } },
    orderBy: { dataHora: 'asc' },
  })

  const atrasados = agendamentos.filter((a) => a.dataHora < agora)
  const proximos7Dias = agendamentos.filter((a) => a.dataHora >= agora && a.dataHora <= limite)
  const totalMaisAdiante = agendamentos.length - atrasados.length - proximos7Dias.length

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-xl">Agenda</h1>

        {atrasados.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-base">
              Atrasados <span className="font-normal text-prata-500">— ainda sem resposta</span>
            </h2>
            <div className="flex flex-col gap-4">
              {atrasados.map((agendamento) => (
                <ItemAgenda key={agendamento.id} agendamento={agendamento} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-base">Próximos 7 dias</h2>
          {proximos7Dias.length === 0 ? (
            <p className="text-sm text-prata-500">Nenhum agendamento nos próximos 7 dias.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {proximos7Dias.map((agendamento) => (
                <ItemAgenda key={agendamento.id} agendamento={agendamento} />
              ))}
            </div>
          )}
          {totalMaisAdiante > 0 && (
            <p className="mt-4 text-sm text-prata-500">
              + {totalMaisAdiante} agendamento{totalMaisAdiante > 1 ? 's' : ''} mais adiante.
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

function ItemAgenda({
  agendamento,
}: {
  agendamento: {
    id: string
    tipo: keyof typeof ROTULO_TIPO_CONTATO
    dataHora: Date
    pessoa: { id: string; nome: string; fotoUrl: string | null }
  }
}) {
  return (
    <Cartao className="p-5">
      <div className="flex items-start gap-4">
        <Link href={`/pessoas/${agendamento.pessoa.id}`}>
          <Avatar nome={agendamento.pessoa.nome} fotoUrl={agendamento.pessoa.fotoUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/pessoas/${agendamento.pessoa.id}`} className="hover:underline">
            <h3 className="truncate text-base">{agendamento.pessoa.nome}</h3>
          </Link>
          <p className="mt-1 text-sm text-prata-600">
            {ICONE_TIPO_CONTATO[agendamento.tipo]} {ROTULO_TIPO_CONTATO[agendamento.tipo]}
            {' — '}
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(
              agendamento.dataHora,
            )}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <AgendamentoAcoes
          agendamentoId={agendamento.id}
          dataHoraAtual={dataParaDatetimeLocal(agendamento.dataHora)}
        />
      </div>
    </Cartao>
  )
}
