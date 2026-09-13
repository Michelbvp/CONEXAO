'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Botao } from '@/components/ui/Botao'

export function BotaoExcluirCategoria({ categoriaId, nome }: { categoriaId: string; nome: string }) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function excluir() {
    const confirmou = window.confirm(`Excluir a categoria "${nome}"? Essa ação não pode ser desfeita.`)
    if (!confirmou) return

    setEnviando(true)
    setErro(null)
    try {
      const resposta = await fetch(`/api/categorias/${categoriaId}`, { method: 'DELETE' })
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null)
        throw new Error(dados?.erro ?? 'Não foi possível excluir a categoria.')
      }
      router.refresh()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir a categoria.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div>
      <Botao variante="perigo" tamanho="sm" disabled={enviando} onClick={excluir}>
        {enviando ? 'Excluindo…' : 'Excluir'}
      </Botao>
      {erro && <p className="mt-2 text-xs text-grafite-800">{erro}</p>}
    </div>
  )
}
