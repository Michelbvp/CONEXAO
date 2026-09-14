import type { StatusContato } from '@/lib/cadencia'
import { cn } from '@/lib/utils'

// A intensidade de cinza — não a cor — comunica urgência: quanto mais
// atrasado o contato, mais escuro o selo. Isso respeita a paleta
// monocromática pedida e ainda assim mantém a informação acessível, já que
// o texto (não só o tom) também muda ("Em dia" / "Atenção" / "Atrasado").
const estilos: Record<StatusContato, string> = {
  EM_DIA: 'bg-prata-100 text-grafite-700 border-prata-200',
  ATENCAO: 'bg-prata-300 text-grafite-900 border-prata-400',
  ATRASADO: 'bg-grafite-900 text-marfim border-grafite-900',
  SEM_HISTORICO: 'bg-white text-prata-600 border-dashed border-prata-400',
}

const rotulos: Record<StatusContato, string> = {
  EM_DIA: 'Em dia',
  ATENCAO: 'Atenção',
  ATRASADO: 'Atrasado',
  SEM_HISTORICO: 'Sem histórico',
}

export function SeloStatus({ status }: { status: StatusContato }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border px-3 py-0.5 text-xs font-medium tracking-wide',
        estilos[status],
      )}
    >
      {rotulos[status]}
    </span>
  )
}
