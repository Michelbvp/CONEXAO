'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Botao } from '@/components/ui/Botao'
import { agoraParaDatetimeLocal } from '@/lib/formatacao'

export function AgendamentoAcoes({
  agendamentoId,
  dataHoraAtual,
}: {
  agendamentoId: string
  /** Data/horário atual do agendamento, no formato aceito por um input datetime-local. */
  dataHoraAtual: string
}) {
  const router = useRouter()
  const [modo, setModo] = useState<'inicial' | 'reagendando'>('inicial')
  const [dataHora, setDataHora] = useState(dataHoraAtual || agoraParaDatetimeLocal())
  const [carregando, setCarregando] = useState<'realizado' | 'cancelar' | 'reagendar' | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function responder(acao: 'realizado' | 'cancelar' | 'reagendar', dataHoraEscolhida?: string) {
    setCarregando(acao)
    setErro(null)
    try {
      const resposta = await fetch(`/api/agendamentos/${agendamentoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao,
          ...(dataHoraEscolhida ? { dataHora: new Date(dataHoraEscolhida).toISOString() } : {}),
        }),
      })
      if (!resposta.ok) throw new Error()
      router.refresh()
      setModo('inicial')
    } catch {
      setErro('Não foi possível registrar sua resposta. Tente novamente.')
    } finally {
      setCarregando(null)
    }
  }

  async function cancelar() {
    const confirmou = window.confirm('Cancelar este agendamento? Ele vai para o histórico marcado como cancelado.')
    if (!confirmou) return
    await responder('cancelar')
  }

  if (modo === 'reagendando') {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={`reagendar-${agendamentoId}`} className="text-xs font-medium text-grafite-800">
          Nova data/horário
        </label>
        <input
          id={`reagendar-${agendamentoId}`}
          type="datetime-local"
          className="campo-texto"
          value={dataHora}
          onChange={(evento) => setDataHora(evento.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Botao tamanho="sm" disabled={carregando !== null} onClick={() => responder('reagendar', dataHora)}>
            {carregando === 'reagendar' ? 'Salvando…' : 'Salvar nova data'}
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
        <Botao tamanho="sm" disabled={carregando !== null} onClick={() => responder('realizado')}>
          {carregando === 'realizado' ? 'Registrando…' : 'Realizado'}
        </Botao>
        <Botao
          tamanho="sm"
          variante="secundario"
          disabled={carregando !== null}
          onClick={() => setModo('reagendando')}
        >
          Reagendar
        </Botao>
        <Botao tamanho="sm" variante="perigo" disabled={carregando !== null} onClick={cancelar}>
          {carregando === 'cancelar' ? 'Cancelando…' : 'Cancelar'}
        </Botao>
      </div>
      {erro && <p className="mt-2 text-xs text-grafite-700">{erro}</p>}
    </div>
  )
}
