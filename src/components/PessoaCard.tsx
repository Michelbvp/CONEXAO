import Link from 'next/link'

import { AgendamentoAcoes } from '@/components/AgendamentoAcoes'
import { SugestaoAcoes } from '@/components/SugestaoAcoes'
import { Avatar } from '@/components/ui/Avatar'
import { Cartao } from '@/components/ui/Cartao'
import { SeloStatus } from '@/components/ui/SeloStatus'
import { dataParaDatetimeLocal, formatarDiasDesde } from '@/lib/formatacao'
import { ICONE_TIPO_CONTATO, ROTULO_TIPO_CONTATO } from '@/lib/rotulos'
import type { PessoaResumo } from '@/lib/dashboard'

export function PessoaCard({ pessoa }: { pessoa: PessoaResumo }) {
  return (
    <Cartao className="p-5">
      <Link href={`/pessoas/${pessoa.id}`} className="flex items-start gap-4">
        <Avatar nome={pessoa.nome} fotoUrl={pessoa.fotoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base">{pessoa.nome}</h3>
            <SeloStatus status={pessoa.status} />
          </div>
          <p className="mt-1 text-sm text-prata-600">
            {formatarDiasDesde(pessoa.diasDesdeUltimoContato)}
            {pessoa.ultimoTipoContato && ` · ${ICONE_TIPO_CONTATO[pessoa.ultimoTipoContato]} ${ROTULO_TIPO_CONTATO[pessoa.ultimoTipoContato]}`}
          </p>
        </div>
      </Link>

      {pessoa.sugestaoPendente && (
        <div className="mt-4 rounded-xl border border-prata-200 bg-prata-100/60 p-4">
          <p className="text-sm text-grafite-800">
            <span className="font-medium">
              Sugestão: {ICONE_TIPO_CONTATO[pessoa.sugestaoPendente.tipoSugerido]}{' '}
              {ROTULO_TIPO_CONTATO[pessoa.sugestaoPendente.tipoSugerido]}
            </span>
            {pessoa.sugestaoPendente.motivo && (
              <span className="text-prata-600"> — {pessoa.sugestaoPendente.motivo}</span>
            )}
          </p>
          <div className="mt-3">
            <SugestaoAcoes sugestaoId={pessoa.sugestaoPendente.id} />
          </div>
        </div>
      )}

      {pessoa.agendamentoPendente && (
        <div className="mt-4 rounded-xl border border-prata-200 bg-prata-100/60 p-4">
          <p className="text-sm text-grafite-800">
            <span className="font-medium">
              Agendado: {ICONE_TIPO_CONTATO[pessoa.agendamentoPendente.tipo]}{' '}
              {ROTULO_TIPO_CONTATO[pessoa.agendamentoPendente.tipo]}
            </span>
            <span className="text-prata-600">
              {' — '}
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(
                pessoa.agendamentoPendente.dataHora,
              )}
            </span>
          </p>
          <div className="mt-3">
            <AgendamentoAcoes
              agendamentoId={pessoa.agendamentoPendente.id}
              dataHoraAtual={dataParaDatetimeLocal(pessoa.agendamentoPendente.dataHora)}
            />
          </div>
        </div>
      )}
    </Cartao>
  )
}
