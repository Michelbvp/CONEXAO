import { ButtonHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/lib/utils'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo'
type Tamanho = 'sm' | 'md'

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
}

// Botões sempre em formato de pílula (borderRadius "pill" do tema), únicos
// na paleta preto/cinza/prata/branco pedida no design.
const estilosVariante: Record<Variante, string> = {
  primario: 'bg-grafite-950 text-marfim hover:bg-grafite-800 active:bg-grafite-900',
  secundario: 'bg-prata-100 text-grafite-900 hover:bg-prata-200 border border-prata-300',
  fantasma: 'bg-transparent text-grafite-700 hover:bg-prata-100',
  perigo: 'bg-transparent text-grafite-700 border border-prata-400 hover:bg-prata-100',
}

const estilosTamanho: Record<Tamanho, string> = {
  sm: 'text-sm px-4 py-1.5 gap-1.5',
  md: 'text-[0.95rem] px-6 py-2.5 gap-2',
}

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(function Botao(
  { className, variante = 'primario', tamanho = 'md', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-pill font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grafite-700',
        estilosVariante[variante],
        estilosTamanho[tamanho],
        className,
      )}
      {...props}
    />
  )
})
