'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Botao } from '@/components/ui/Botao'
import { listaTiposContato, ROTULO_TIPO_CONTATO } from '@/lib/rotulos'

export function FormularioInteracao({ pessoaId }: { pessoaId: string }) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)

    // Guarda uma referência direta ao elemento do formulário antes do
    // `await` abaixo: o React zera `evento.currentTarget` assim que o
    // disparo síncrono do evento termina, então usá-lo depois de esperar o
    // fetch (para chamar `.reset()`) lançava um erro — e o contato já tinha
    // sido salvo com sucesso quando isso acontecia.
    const formularioElemento = evento.currentTarget
    const formulario = new FormData(formularioElemento)
    const corpo = {
      pessoaId,
      tipo: formulario.get('tipo'),
      data: formulario.get('data') || undefined,
    }

    try {
      const resposta = await fetch('/api/interacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      if (!resposta.ok) throw new Error()
      formularioElemento.reset()
      router.refresh()
    } catch {
      setErro('Não foi possível registrar o contato. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
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
          Data
        </label>
        <input id="data" name="data" type="date" className="campo-texto" />
      </div>
      <Botao type="submit" disabled={enviando} className="shrink-0">
        {enviando ? 'Salvando…' : 'Registrar contato'}
      </Botao>
      {erro && <p className="text-sm text-grafite-800">{erro}</p>}
    </form>
  )
}
