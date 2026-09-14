export function formatarDiasDesde(dias: number | null): string {
  if (dias === null) return 'Nenhum contato registrado ainda'
  if (dias === 0) return 'Contato hoje'
  if (dias === 1) return 'Contato ontem'
  return `Há ${dias} dias`
}

/**
 * Converte uma data qualquer para o formato exigido por um input HTML
 * `datetime-local` ("AAAA-MM-DDTHH:mm"), no fuso horário local do
 * navegador — sem isso, o input mostraria a hora em UTC.
 */
export function dataParaDatetimeLocal(data: Date): string {
  const comFusoLocal = new Date(data)
  comFusoLocal.setMinutes(comFusoLocal.getMinutes() - comFusoLocal.getTimezoneOffset())
  return comFusoLocal.toISOString().slice(0, 16)
}

/** Valor padrão (agora) para um input `datetime-local`. */
export function agoraParaDatetimeLocal(): string {
  return dataParaDatetimeLocal(new Date())
}
