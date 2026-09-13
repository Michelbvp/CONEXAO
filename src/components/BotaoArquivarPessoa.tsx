'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Botao } from '@/components/ui/Botao'

export function BotaoArquivarPessoa({ pessoaId, nome }: { pessoaId: string; nome: string }) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)

  async function arquivar() {
    const confirmou = window.confirm(
      `Arquivar ${nome}? O histórico de contatos é mantido, mas a pessoa some da tela principal. Você pode reverter isso diretamente no banco de dados por enquanto.`,
    )
    if (!confirmou) return

    setEnviando(true)
    try {
      const resposta = await fetch(`/api/pessoas/${pessoaId}`, { method: 'DELETE' })
      if (!resposta.ok) throw new Error()
      router.push('/')
      router.refresh()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Botao variante="perigo" tamanho="sm" disabled={enviando} onClick={arquivar}>
      {enviando ? 'Arquivando…' : 'Arquivar pessoa'}
    </Botao>
  )
}
