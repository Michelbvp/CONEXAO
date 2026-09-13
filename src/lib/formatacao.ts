export function formatarDiasDesde(dias: number | null): string {
  if (dias === null) return 'Nenhum contato registrado ainda'
  if (dias === 0) return 'Contato hoje'
  if (dias === 1) return 'Contato ontem'
  return `Há ${dias} dias`
}

/**
 * Valor padrão (agora, no fuso horário local do navegador) para um input
 * HTML `datetime-local`, no formato exigido por ele: "AAAA-MM-DDTHH:mm".
 */
export function agoraParaDatetimeLocal(): string {
  const agora = new Date()
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset())
  return agora.toISOString().slice(0, 16)
}
