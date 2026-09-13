import Image from 'next/image'

import { cn } from '@/lib/utils'

function iniciais(nome: string): string {
  // Só considera palavras que começam com letra — evita pegar parênteses ou
  // pontuação quando o nome tem um apelido entre parênteses, ex.: "Dona
  // Helena (mãe)" deve virar "DH", não "D(".
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => /^\p{L}/u.test(parte))
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1]?.[0] ?? '' : ''
  return (primeira + ultima).toUpperCase()
}

export function Avatar({
  nome,
  fotoUrl,
  tamanho = 44,
}: {
  nome: string
  fotoUrl?: string | null
  tamanho?: number
}) {
  if (fotoUrl) {
    return (
      <Image
        src={fotoUrl}
        alt={nome}
        width={tamanho}
        height={tamanho}
        className="rounded-full border border-prata-200 object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border border-prata-300 bg-prata-100 font-semibold text-grafite-700',
      )}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
      aria-hidden
    >
      {iniciais(nome)}
    </div>
  )
}
