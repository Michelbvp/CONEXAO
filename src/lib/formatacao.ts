export function formatarDiasDesde(dias: number | null): string {
  if (dias === null) return 'Nenhum contato registrado ainda'
  if (dias === 0) return 'Contato hoje'
  if (dias === 1) return 'Contato ontem'
  return `Há ${dias} dias`
}
