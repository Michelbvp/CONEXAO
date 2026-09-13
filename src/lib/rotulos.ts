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

// Duração padrão (minutos) do evento criado no Google Calendário ao
// confirmar uma sugestão — só uma estimativa razoável; o usuário pode
// ajustar o horário de término direto no Google Calendário depois.
export const DURACAO_MINUTOS_TIPO_CONTATO: Record<TipoContato, number> = {
  CAFE: 30,
  LIGACAO: 15,
  VIDEOCHAMADA: 30,
  ALMOCO: 60,
  JANTAR: 90,
  EMAIL: 15,
  MENSAGEM: 10,
  ENCONTRO_PRESENCIAL: 60,
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
