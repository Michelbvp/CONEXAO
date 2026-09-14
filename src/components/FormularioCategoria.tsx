'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Botao } from '@/components/ui/Botao'
import { Campo } from '@/components/ui/Campo'
import { ICONE_TIPO_CONTATO, ROTULO_TIPO_CONTATO, listaTiposContato } from '@/lib/rotulos'

export type CategoriaParaEditar = {
  id: string
  nome: string
  icone: string
  cadenciaDiasPadrao: number
  tiposPreferidos: string[]
}

export function FormularioCategoria({ categoria }: { categoria?: CategoriaParaEditar }) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const emEdicao = categoria !== undefined

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)

    const formulario = new FormData(evento.currentTarget)
    const corpo = {
      nome: formulario.get('nome'),
      icone: formulario.get('icone'),
      cadenciaDiasPadrao: formulario.get('cadenciaDiasPadrao'),
      tiposPreferidos: formulario.getAll('tiposPreferidos'),
    }

    try {
      const resposta = await fetch(emEdicao ? `/api/categorias/${categoria.id}` : '/api/categorias', {
        method: emEdicao ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null)
        throw new Error(dados?.erro ?? 'Não foi possível salvar.')
      }
      router.push('/categorias')
      router.refresh()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-5">
      <Campo label="Nome" htmlFor="nome" obrigatorio>
        <input
          id="nome"
          name="nome"
          required
          maxLength={60}
          className="campo-texto"
          placeholder="Ex.: Amigos"
          defaultValue={categoria?.nome}
        />
      </Campo>

      <Campo label="Ícone (emoji)" htmlFor="icone" ajuda="Opcional. Um único emoji para identificar a categoria.">
        <input
          id="icone"
          name="icone"
          maxLength={8}
          className="campo-texto w-24"
          placeholder="👤"
          defaultValue={categoria?.icone}
        />
      </Campo>

      <Campo
        label="Cadência padrão (dias)"
        htmlFor="cadenciaDiasPadrao"
        obrigatorio
        ajuda="De quantos em quantos dias o app sugere um novo contato para pessoas desta categoria, por padrão."
      >
        <input
          id="cadenciaDiasPadrao"
          name="cadenciaDiasPadrao"
          type="number"
          required
          min={1}
          max={3650}
          className="campo-texto"
          defaultValue={categoria?.cadenciaDiasPadrao}
        />
      </Campo>

      <Campo
        label="Tipos de contato preferidos"
        htmlFor="tiposPreferidos"
        obrigatorio
        ajuda="O app sugere esses tipos de contato para pessoas desta categoria, alternando entre eles."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {listaTiposContato().map((tipo) => (
            <label
              key={tipo}
              className="flex items-center gap-2 rounded-lg border border-prata-300 px-3 py-2 text-sm text-grafite-800 has-[:checked]:border-grafite-700 has-[:checked]:bg-prata-100"
            >
              <input
                type="checkbox"
                name="tiposPreferidos"
                value={tipo}
                defaultChecked={categoria?.tiposPreferidos.includes(tipo) ?? false}
                className="accent-grafite-950"
              />
              {ICONE_TIPO_CONTATO[tipo]} {ROTULO_TIPO_CONTATO[tipo]}
            </label>
          ))}
        </div>
      </Campo>

      {erro && <p className="text-sm text-grafite-800">{erro}</p>}

      <div className="flex gap-3">
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : emEdicao ? 'Salvar alterações' : 'Criar categoria'}
        </Botao>
        <Botao type="button" variante="secundario" onClick={() => router.back()}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}
