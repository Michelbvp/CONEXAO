import { differenceInCalendarDays } from 'date-fns'
import { TipoContato } from '@prisma/client'

import { cadenciaEfetivaDias, calcularStatusContato, StatusContato } from '@/lib/cadencia'
import { prisma } from '@/lib/prisma'

export type PessoaResumo = {
  id: string
  nome: string
  fotoUrl: string | null
  categoriaId: string
  categoriaNome: string
  categoriaIcone: string
  cadenciaDias: number
  diasDesdeUltimoContato: number | null
  ultimoTipoContato: TipoContato | null
  status: StatusContato
  sugestaoPendente: {
    id: string
    tipoSugerido: TipoContato
    motivo: string | null
  } | null
}

export type CategoriaComPessoas = {
  id: string
  nome: string
  icone: string
  pessoas: PessoaResumo[]
}

/** Monta os dados já prontos para a tela principal: pessoas agrupadas por categoria, com status calculado. */
export async function obterDashboard(userId: string): Promise<CategoriaComPessoas[]> {
  const categorias = await prisma.categoria.findMany({
    where: { userId },
    orderBy: { ordem: 'asc' },
    include: {
      pessoas: {
        where: { arquivadoEm: null },
        orderBy: { nome: 'asc' },
        include: {
          interacoes: { orderBy: { data: 'desc' }, take: 1 },
          sugestoes: { where: { status: 'PENDENTE' }, take: 1, orderBy: { criadoEm: 'desc' } },
        },
      },
    },
  })

  return categorias.map((categoria) => ({
    id: categoria.id,
    nome: categoria.nome,
    icone: categoria.icone,
    pessoas: categoria.pessoas.map((pessoa): PessoaResumo => {
      const ultimaInteracao = pessoa.interacoes[0] ?? null
      const diasDesde = ultimaInteracao
        ? differenceInCalendarDays(new Date(), ultimaInteracao.data)
        : null
      const cadenciaDias = cadenciaEfetivaDias(pessoa, categoria)
      const sugestao = pessoa.sugestoes[0] ?? null

      return {
        id: pessoa.id,
        nome: pessoa.nome,
        fotoUrl: pessoa.fotoUrl,
        categoriaId: categoria.id,
        categoriaNome: categoria.nome,
        categoriaIcone: categoria.icone,
        cadenciaDias,
        diasDesdeUltimoContato: diasDesde,
        ultimoTipoContato: ultimaInteracao?.tipo ?? null,
        status: calcularStatusContato(diasDesde, cadenciaDias),
        sugestaoPendente: sugestao
          ? { id: sugestao.id, tipoSugerido: sugestao.tipoSugerido, motivo: sugestao.motivo }
          : null,
      }
    }),
  }))
}
