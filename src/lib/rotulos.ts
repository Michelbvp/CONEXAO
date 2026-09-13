import { TipoContato } from '@prisma/client'

// Centraliza todo texto/ícone voltado ao usuário para os enums do banco,
// para nunca espalhar strings mágicas pelas páginas e componentes.
export const ROTULO_TIPO_CONTATO: Record<TipoContato, string> = {
  CAFE: 'Café',
  LIGACAO: 'Ligação',
  VIDEOCHAMADA: 'Videochamada',
  ALMOCO: 'Almoço',
  JANTAR: 'Jantar',
  EMAIL: 'E-mail',
  MENSAGEM: 'Mensagem',
  ENCONTRO_PRESENCIAL: 'Encontro presencial',
}

export const ICONE_TIPO_CONTATO: Record<TipoContato, string> = {
  CAFE: '☕',
  LIGACAO: '📞',
  VIDEOCHAMADA: '🎥',
  ALMOCO: '🍽️',
  JANTAR: '🍷',
  EMAIL: '✉️',
  MENSAGEM: '💬',
  ENCONTRO_PRESENCIAL: '🤝',
}

export function listaTiposContato(): TipoContato[] {
  return Object.keys(ROTULO_TIPO_CONTATO) as TipoContato[]
}

/** Converte a string salva em Categoria.tiposPreferidos (ex.: "LIGACAO,CAFE") em enums válidos. */
export function parseTiposPreferidos(valor: string): TipoContato[] {
  const validos = new Set(listaTiposContato())
  return valor
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is TipoContato => validos.has(s as TipoContato))
}
