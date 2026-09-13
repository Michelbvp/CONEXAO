'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Botao } from '@/components/ui/Botao'

export function SugestaoAcoes({ sugestaoId }: { sugestaoId: string }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState<'confirmar' | 'recusar' | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function responder(acao: 'confirmar' | 'recusar') {
    setCarregando(acao)
    setErro(null)
    try {
      const resposta = await fetch(`/api/sugestoes/${sugestaoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      })
      if (!resposta.ok) throw new Error()
      router.refresh()
    } catch {
      setErro('Não foi possível registrar sua resposta. Tente novamente.')
    } finally {
      setCarregando(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Botao tamanho="sm" disabled={carregando !== null} onClick={() => responder('confirmar')}>
          {carregando === 'confirmar' ? 'Confirmando…' : 'Confirmar contato'}
        </Botao>
        <Botao
          tamanho="sm"
          variante="secundario"
          disabled={carregando !== null}
          onClick={() => responder('recusar')}
        >
          {carregando === 'recusar' ? 'Recusando…' : 'Agora não'}
        </Botao>
      </div>
      {erro && <p className="mt-2 text-xs text-grafite-700">{erro}</p>}
    </div>
  )
}
