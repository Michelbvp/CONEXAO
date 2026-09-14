import { differenceInCalendarDays } from 'date-fns'
import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AgendamentoAcoes } from '@/components/AgendamentoAcoes'
import { BotaoArquivarPessoa } from '@/components/BotaoArquivarPessoa'
import { CabecalhoApp } from '@/components/CabecalhoApp'
import { FormularioInteracao } from '@/components/FormularioInteracao'
import { SugestaoAcoes } from '@/components/SugestaoAcoes'
import { Avatar } from '@/components/ui/Avatar'
import { Botao } from '@/components/ui/Botao'
import { Cartao } from '@/components/ui/Cartao'
import { SeloStatus } from '@/components/ui/SeloStatus'
import { authOptions } from '@/lib/auth'
import { cadenciaEfetivaDias, calcularStatusContato } from '@/lib/cadencia'
import { dataParaDatetimeLocal, formatarDiasDesde } from '@/lib/formatacao'
import { prisma } from '@/lib/prisma'
import { ICONE_TIPO_CONTATO, ROTULO_TIPO_CONTATO } from '@/lib/rotulos'

export default async function PaginaPessoa({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { id } = await params
  const pessoa = await prisma.pessoa.findFirst({
    where: { id, userId: session.user.id },
    include: {
      categoria: true,
      interacoes: { orderBy: { data: 'desc' } },
      sugestoes: { where: { status: 'PENDENTE' }, orderBy: { criadoEm: 'desc' } },
      agendamentos: { orderBy: { dataHora: 'desc' } },
    },
  })
  if (!pessoa) notFound()

  const ultimaInteracao = pessoa.interacoes[0] ?? null
  const diasDesde = ultimaInteracao
    ? differenceInCalendarDays(new Date(), ultimaInteracao.data)
    : null
  const cadenciaDias = cadenciaEfetivaDias(pessoa, pessoa.categoria)
  const status = calcularStatusContato(diasDesde, cadenciaDias)
  const sugestaoPendente = pessoa.sugestoes[0] ?? null
  const agendamentoPendente = pessoa.agendamentos.find((a) => a.status === 'AGENDADO') ?? null

  // Histórico = interações de verdade + agendamentos cancelados (que nunca
  // viram interação, mas o usuário precisa ver que existiram e o que
  // aconteceu com eles). Agendamentos REALIZADOS já aparecem via a
  // interação que geraram, então não entram aqui de novo.
  type ItemHistorico = {
    id: string
    data: Date
    tipo: (typeof pessoa.interacoes)[number]['tipo']
    googleEventLink: string | null
    cancelado: boolean
  }
  const historico: ItemHistorico[] = [
    ...pessoa.interacoes.map(
      (i): ItemHistorico => ({ id: i.id, data: i.data, tipo: i.tipo, googleEventLink: i.googleEventLink, cancelado: false }),
    ),
    ...pessoa.agendamentos
      .filter((a) => a.status === 'CANCELADO')
      .map(
        (a): ItemHistorico => ({ id: a.id, data: a.dataHora, tipo: a.tipo, googleEventLink: null, cancelado: true }),
      ),
  ].sort((a, b) => b.data.getTime() - a.data.getTime())

  return (
    <div className="min-h-screen bg-marfim">
      <CabecalhoApp session={session} />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Cartao className="p-6">
          <div className="flex items-start gap-4">
            <Avatar nome={pessoa.nome} fotoUrl={pessoa.fotoUrl} tamanho={56} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl">{pessoa.nome}</h1>
                <SeloStatus status={status} />
              </div>
              <p className="mt-1 text-sm text-prata-600">
                {pessoa.categoria.icone} {pessoa.categoria.nome} · sugestão de contato a cada{' '}
                {cadenciaDias} dias
              </p>
              <p className="mt-1 text-sm text-prata-600">{formatarDiasDesde(diasDesde)}</p>
              {(pessoa.email || pessoa.telefone) && (
                <p className="mt-1 text-sm text-prata-600">
                  {[pessoa.email, pessoa.telefone].filter(Boolean).join(' · ')}
                </p>
              )}
              {pessoa.notas && <p className="mt-3 text-sm text-grafite-700">{pessoa.notas}</p>}
            </div>
          </div>

          <div className="mt-5 flex gap-3 border-t border-prata-200 pt-4">
            <Link href={`/pessoas/${pessoa.id}/editar`}>
              <Botao variante="secundario" tamanho="sm">
                Editar
              </Botao>
            </Link>
            <BotaoArquivarPessoa pessoaId={pessoa.id} nome={pessoa.nome} />
          </div>
        </Cartao>

        {sugestaoPendente && (
          <Cartao className="mt-6 p-6">
            <h2 className="text-base">Sugestão de contato pendente</h2>
            <p className="mt-1 text-sm text-grafite-800">
              {ICONE_TIPO_CONTATO[sugestaoPendente.tipoSugerido]}{' '}
              {ROTULO_TIPO_CONTATO[sugestaoPendente.tipoSugerido]}
              {sugestaoPendente.motivo && (
                <span className="text-prata-600"> — {sugestaoPendente.motivo}</span>
              )}
            </p>
            <div className="mt-3">
              <SugestaoAcoes sugestaoId={sugestaoPendente.id} />
            </div>
          </Cartao>
        )}

        {agendamentoPendente && (
          <Cartao className="mt-6 p-6">
            <h2 className="text-base">Agendamento</h2>
            <p className="mt-1 text-sm text-grafite-800">
              {ICONE_TIPO_CONTATO[agendamentoPendente.tipo]} {ROTULO_TIPO_CONTATO[agendamentoPendente.tipo]}
              <span className="text-prata-600">
                {' — '}
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(
                  agendamentoPendente.dataHora,
                )}
              </span>
            </p>
            <div className="mt-3">
              <AgendamentoAcoes
                agendamentoId={agendamentoPendente.id}
                dataHoraAtual={dataParaDatetimeLocal(agendamentoPendente.dataHora)}
              />
            </div>
          </Cartao>
        )}

        <Cartao className="mt-6 p-6">
          <h2 className="mb-4 text-base">Registrar um contato</h2>
          <FormularioInteracao pessoaId={pessoa.id} />
        </Cartao>

        <Cartao className="mt-6 p-6">
          <h2 className="mb-4 text-base">Histórico</h2>
          {historico.length === 0 ? (
            <p className="text-sm text-prata-500">Nenhum contato registrado ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {historico.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 border-b border-prata-100 pb-3 last:border-0 last:pb-0"
                >
                  <span className={item.cancelado ? 'text-sm text-prata-500' : 'text-sm text-grafite-800'}>
                    {ICONE_TIPO_CONTATO[item.tipo]} {ROTULO_TIPO_CONTATO[item.tipo]}
                    {item.cancelado && ' · Cancelado'}
                    {item.googleEventLink && (
                      <>
                        {' · '}
                        <a
                          href={item.googleEventLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-prata-400 underline-offset-2 hover:text-grafite-950"
                        >
                          Ver no Google Calendário
                        </a>
                      </>
                    )}
                  </span>
                  <span className="shrink-0 text-sm text-prata-500">
                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(item.data)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </main>
    </div>
  )
}
