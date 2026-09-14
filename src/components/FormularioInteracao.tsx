'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Botao } from '@/components/ui/Botao'
import { agoraParaDatetimeLocal } from '@/lib/formatacao'
import { listaTiposContato, ROTULO_TIPO_CONTATO } from '@/lib/rotulos'

export function FormularioInteracao({ pessoaId }: { pessoaId: string }) {
  const router = useRouter()
  const [dataHora, setDataHora] = useState(agoraParaDatetimeLocal)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)
    setAviso(null)

    // Ver FormularioInteracao antigo / commit de correção: guardar isso
    // antes do `await` é necessário porque o React zera
    // `evento.currentTarget` assim que o disparo síncrono do evento termina.
    const formularioElemento = evento.currentTarget
    const formulario = new FormData(formularioElemento)
    const corpo = {
      pessoaId,
      tipo: formulario.get('tipo'),
      // Convertido para um instante absoluto (ISO com fuso) ainda no
      // navegador — é o único lugar que sabe o fuso horário real do
      // usuário. Mandar a string "crua" do input faria o servidor
      // interpretar a hora no fuso dele, não no da pessoa.
      data: dataHora ? new Date(dataHora).toISOString() : undefined,
    }

    try {
      const resposta = await fetch('/api/interacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      if (!resposta.ok) throw new Error()
      const dados = await resposta.json()

      if (dados.agendamento) {
        setAviso('Como a data é no futuro, isso foi para a Agenda como um agendamento, em vez de ir direto pro histórico.')
      } else if (dados.googleCalendar === 'erro') {
        setAviso('Contato registrado, mas não deu para criar o evento no Google Calendário.')
      }

      formularioElemento.reset()
      setDataHora(agoraParaDatetimeLocal())
      router.refresh()
    } catch {
      setErro('Não foi possível registrar o contato. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="tipo" className="mb-1.5 block text-sm font-medium text-grafite-800">
            Tipo de contato
          </label>
          <select id="tipo" name="tipo" required className="campo-texto">
            {listaTiposContato().map((tipo) => (
              <option key={tipo} value={tipo}>
                {ROTULO_TIPO_CONTATO[tipo]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="data" className="mb-1.5 block text-sm font-medium text-grafite-800">
            Data e horário
          </label>
          <input
            id="data"
            name="data"
            type="datetime-local"
            className="campo-texto"
            value={dataHora}
            onChange={(evento) => setDataHora(evento.target.value)}
          />
        </div>
        <Botao type="submit" disabled={enviando} className="shrink-0">
          {enviando ? 'Salvando…' : 'Registrar contato'}
        </Botao>
      </div>
      {erro && <p className="text-sm text-grafite-800">{erro}</p>}
      {aviso && <p className="text-sm text-prata-600">{aviso}</p>}
    </form>
  )
}
