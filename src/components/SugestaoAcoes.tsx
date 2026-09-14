'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Botao } from '@/components/ui/Botao'
import { agoraParaDatetimeLocal } from '@/lib/formatacao'

export function SugestaoAcoes({ sugestaoId }: { sugestaoId: string }) {
  const router = useRouter()
  const [modo, setModo] = useState<'inicial' | 'escolhendo_data'>('inicial')
  const [dataHora, setDataHora] = useState(agoraParaDatetimeLocal)
  const [carregando, setCarregando] = useState<'confirmar' | 'recusar' | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function recusar() {
    setCarregando('recusar')
    setErro(null)
    try {
      const resposta = await fetch(`/api/sugestoes/${sugestaoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'recusar' }),
      })
      if (!resposta.ok) throw new Error()
      router.refresh()
    } catch {
      setErro('Não foi possível registrar sua resposta. Tente novamente.')
    } finally {
      setCarregando(null)
    }
  }

  async function confirmar() {
    setCarregando('confirmar')
    setErro(null)
    setAviso(null)
    try {
      const resposta = await fetch(`/api/sugestoes/${sugestaoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'confirmar', dataHora: new Date(dataHora).toISOString() }),
      })
      if (!resposta.ok) throw new Error()
      const dados = await resposta.json()
      setModo('inicial')
      if (dados.googleCalendar === 'erro') {
        // O contato já foi registrado com sucesso — só o evento no Google
        // Calendário que falhou. Damos um tempo para a pessoa ler o aviso
        // antes de atualizar a tela (um `router.refresh()` imediato faria
        // este card sumir junto, já que a sugestão deixa de estar pendente).
        setAviso('Contato registrado, mas não deu para criar o evento no Google Calendário.')
        setCarregando(null)
        setTimeout(() => router.refresh(), 3000)
        return
      }
      router.refresh()
    } catch {
      setErro('Não foi possível registrar sua resposta. Tente novamente.')
    } finally {
      setCarregando(null)
    }
  }

  if (modo === 'escolhendo_data') {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={`data-${sugestaoId}`} className="text-xs font-medium text-grafite-800">
          Quando vai ser o contato?
        </label>
        <input
          id={`data-${sugestaoId}`}
          type="datetime-local"
          className="campo-texto"
          value={dataHora}
          onChange={(evento) => setDataHora(evento.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Botao tamanho="sm" disabled={carregando !== null} onClick={confirmar}>
            {carregando === 'confirmar' ? 'Confirmando…' : 'Confirmar'}
          </Botao>
          <Botao
            tamanho="sm"
            variante="secundario"
            disabled={carregando !== null}
            onClick={() => setModo('inicial')}
          >
            Voltar
          </Botao>
        </div>
        {erro && <p className="text-xs text-grafite-700">{erro}</p>}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Botao tamanho="sm" disabled={carregando !== null} onClick={() => setModo('escolhendo_data')}>
          Confirmar contato
        </Botao>
        <Botao tamanho="sm" variante="secundario" disabled={carregando !== null} onClick={recusar}>
          {carregando === 'recusar' ? 'Recusando…' : 'Agora não'}
        </Botao>
      </div>
      {erro && <p className="mt-2 text-xs text-grafite-700">{erro}</p>}
      {aviso && <p className="mt-2 text-xs text-prata-600">{aviso}</p>}
    </div>
  )
}
