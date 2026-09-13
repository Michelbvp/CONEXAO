// ============================================================================
// Regras de cadência e geração de sugestões de contato.
// ----------------------------------------------------------------------------
// Este é o "cérebro" do produto: decide, para cada pessoa, se já passou
// tempo suficiente desde o último contato e, se sim, cria uma Sugestao
// (status PENDENTE) para o usuário confirmar ou recusar. Nada é agendado de
// verdade sem confirmação explícita do usuário — ver Sugestao.confirmar() em
// src/app/api/sugestoes/[id]/route.ts.
//
// Hoje as sugestões são geradas "sob demanda" (toda vez que o dashboard é
// carregado, ver sincronizarSugestoesDoUsuario). Numa iteração futura isso
// pode virar um job agendado (Vercel Cron) que roda 1x/dia — ver
// docs/ROADMAP.md — mas a regra de negócio em si não muda.
// ============================================================================

import { differenceInCalendarDays } from 'date-fns'
import { Categoria, Pessoa, TipoContato } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { parseTiposPreferidos } from '@/lib/rotulos'

export type StatusContato = 'SEM_HISTORICO' | 'EM_DIA' | 'ATENCAO' | 'ATRASADO'

// Acima de 100% da cadência ideal: atrasado. Entre 70% e 100%: já vale
// avisar o usuário (fica "amarelo"/atenção) antes que vire atraso.
const LIMIAR_ATENCAO = 0.7

export function cadenciaEfetivaDias(
  pessoa: Pick<Pessoa, 'cadenciaDiasPersonalizada'>,
  categoria: Pick<Categoria, 'cadenciaDiasPadrao'>,
): number {
  return pessoa.cadenciaDiasPersonalizada ?? categoria.cadenciaDiasPadrao
}

export function calcularStatusContato(
  diasDesdeUltimoContato: number | null,
  cadenciaDias: number,
): StatusContato {
  if (diasDesdeUltimoContato === null) return 'SEM_HISTORICO'
  if (diasDesdeUltimoContato >= cadenciaDias) return 'ATRASADO'
  if (diasDesdeUltimoContato >= cadenciaDias * LIMIAR_ATENCAO) return 'ATENCAO'
  return 'EM_DIA'
}

/**
 * Escolhe qual tipo de contato sugerir, dando preferência aos tipos
 * cadastrados na categoria e variando em relação ao tipo usado na última
 * interação (para não sugerir sempre "ligação" se a última já foi ligação).
 */
export function escolherTipoSugerido(
  tiposPreferidosCategoria: string,
  ultimoTipoUsado: TipoContato | null,
): TipoContato {
  const preferidos = parseTiposPreferidos(tiposPreferidosCategoria)
  if (preferidos.length === 0) return 'MENSAGEM'
  const candidato = preferidos.find((tipo) => tipo !== ultimoTipoUsado)
  return candidato ?? preferidos[0]!
}

export function motivoSugestao(diasDesdeUltimoContato: number | null): string {
  if (diasDesdeUltimoContato === null) {
    return 'Vocês ainda não têm nenhum contato registrado'
  }
  return `${diasDesdeUltimoContato} ${diasDesdeUltimoContato === 1 ? 'dia' : 'dias'} desde o último contato`
}

/**
 * Percorre todas as pessoas ativas (não arquivadas) de um usuário e cria uma
 * Sugestao PENDENTE para quem estiver em ATENCAO/ATRASADO/SEM_HISTORICO e
 * ainda não tiver uma sugestão pendente em aberto. É seguro chamar com
 * frequência: nunca duplica sugestão para quem já tem uma pendente.
 */
export async function sincronizarSugestoesDoUsuario(userId: string): Promise<void> {
  const pessoas = await prisma.pessoa.findMany({
    where: { userId, arquivadoEm: null },
    include: {
      categoria: true,
      interacoes: { orderBy: { data: 'desc' }, take: 1 },
      sugestoes: { where: { status: 'PENDENTE' }, take: 1 },
    },
  })

  const novasSugestoes: {
    pessoaId: string
    tipoSugerido: TipoContato
    dataSugerida: Date
    motivo: string
  }[] = []

  for (const pessoa of pessoas) {
    if (pessoa.sugestoes.length > 0) continue // já existe sugestão pendente

    const ultimaInteracao = pessoa.interacoes[0] ?? null
    const diasDesde = ultimaInteracao
      ? differenceInCalendarDays(new Date(), ultimaInteracao.data)
      : null
    const cadencia = cadenciaEfetivaDias(pessoa, pessoa.categoria)
    const status = calcularStatusContato(diasDesde, cadencia)

    if (status === 'EM_DIA') continue

    novasSugestoes.push({
      pessoaId: pessoa.id,
      tipoSugerido: escolherTipoSugerido(pessoa.categoria.tiposPreferidos, ultimaInteracao?.tipo ?? null),
      dataSugerida: new Date(),
      motivo: motivoSugestao(diasDesde),
    })
  }

  if (novasSugestoes.length > 0) {
    await prisma.sugestao.createMany({ data: novasSugestoes })
  }
}
