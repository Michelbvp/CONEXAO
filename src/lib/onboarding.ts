import { prisma } from '@/lib/prisma'

// As três categorias pedidas na definição do produto, cada uma com uma
// cadência padrão (em dias) e os tipos de contato que fazem mais sentido
// para aquele tipo de relação. O usuário pode editar tudo isso depois —
// isto é só o ponto de partida de uma conta nova.
export const CATEGORIAS_PADRAO = [
  {
    nome: 'Mentor',
    icone: '🧭',
    cadenciaDiasPadrao: 45,
    tiposPreferidos: 'CAFE,VIDEOCHAMADA,EMAIL',
  },
  {
    nome: 'Colegas de Trabalho',
    icone: '💼',
    cadenciaDiasPadrao: 30,
    tiposPreferidos: 'ALMOCO,CAFE,MENSAGEM',
  },
  {
    nome: 'Família',
    icone: '🏠',
    cadenciaDiasPadrao: 14,
    tiposPreferidos: 'LIGACAO,VIDEOCHAMADA,ENCONTRO_PRESENCIAL',
  },
] as const

/**
 * Garante que um usuário tenha as categorias padrão. É idempotente e segura
 * para rodar em todo login (ex.: primeiro acesso de uma conta criada via
 * OAuth, onde não existe um passo de "cadastro" separado).
 */
export async function garantirCategoriasPadrao(userId: string) {
  const existentes = await prisma.categoria.count({ where: { userId } })
  if (existentes > 0) return

  await prisma.categoria.createMany({
    data: CATEGORIAS_PADRAO.map((c, indice) => ({
      userId,
      nome: c.nome,
      icone: c.icone,
      cadenciaDiasPadrao: c.cadenciaDiasPadrao,
      tiposPreferidos: c.tiposPreferidos,
      ordem: indice,
    })),
  })
}
