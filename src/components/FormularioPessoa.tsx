'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Botao } from '@/components/ui/Botao'

type CategoriaOpcao = { id: string; nome: string; icone: string }

export type PessoaParaEditar = {
  id: string
  nome: string
  categoriaId: string
  email: string | null
  telefone: string | null
  notas: string | null
  cadenciaDiasPersonalizada: number | null
}

export function FormularioPessoa({
  categorias,
  pessoa,
}: {
  categorias: CategoriaOpcao[]
  /** Quando informado, o formulário entra em modo edição (PATCH numa pessoa existente) em vez de criar uma nova. */
  pessoa?: PessoaParaEditar
}) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const emEdicao = pessoa !== undefined

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)

    const formulario = new FormData(evento.currentTarget)
    const cadenciaTexto = formulario.get('cadenciaDiasPersonalizada')
    const corpo = {
      nome: formulario.get('nome'),
      categoriaId: formulario.get('categoriaId'),
      email: formulario.get('email'),
      telefone: formulario.get('telefone'),
      notas: formulario.get('notas'),
      // `null` (não `undefined`) quando vazio: em modo edição isso limpa uma
      // cadência personalizada existente, voltando ao padrão da categoria.
      cadenciaDiasPersonalizada: cadenciaTexto ? Number(cadenciaTexto) : null,
    }

    try {
      const resposta = await fetch(emEdicao ? `/api/pessoas/${pessoa.id}` : '/api/pessoas', {
        method: emEdicao ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null)
        throw new Error(dados?.erro ?? 'Não foi possível salvar.')
      }
      router.push(emEdicao ? `/pessoas/${pessoa.id}` : '/')
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
          maxLength={120}
          className="campo-texto"
          placeholder="Ex.: Ana Beatriz Souza"
          defaultValue={pessoa?.nome}
        />
      </Campo>

      <Campo label="Categoria" htmlFor="categoriaId" obrigatorio>
        <select
          id="categoriaId"
          name="categoriaId"
          required
          className="campo-texto"
          defaultValue={pessoa?.categoriaId}
        >
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.icone} {categoria.nome}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="E-mail" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          maxLength={200}
          className="campo-texto"
          defaultValue={pessoa?.email ?? undefined}
        />
      </Campo>

      <Campo label="Telefone" htmlFor="telefone">
        <input
          id="telefone"
          name="telefone"
          maxLength={40}
          className="campo-texto"
          defaultValue={pessoa?.telefone ?? undefined}
        />
      </Campo>

      <Campo
        label="Cadência personalizada (dias)"
        htmlFor="cadenciaDiasPersonalizada"
        ajuda="Opcional. Sobrescreve, só para esta pessoa, o intervalo padrão da categoria entre um contato e outro."
      >
        <input
          id="cadenciaDiasPersonalizada"
          name="cadenciaDiasPersonalizada"
          type="number"
          min={1}
          max={3650}
          className="campo-texto"
          placeholder="Deixe em branco para usar o padrão da categoria"
          defaultValue={pessoa?.cadenciaDiasPersonalizada ?? undefined}
        />
      </Campo>

      <Campo label="Notas" htmlFor="notas">
        <textarea
          id="notas"
          name="notas"
          rows={3}
          maxLength={2000}
          className="campo-texto"
          defaultValue={pessoa?.notas ?? undefined}
        />
      </Campo>

      {erro && <p className="text-sm text-grafite-800">{erro}</p>}

      <div className="flex gap-3">
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : emEdicao ? 'Salvar alterações' : 'Salvar pessoa'}
        </Botao>
        <Botao type="button" variante="secundario" onClick={() => router.back()}>
          Cancelar
        </Botao>
      </div>
    </form>
  )
}

function Campo({
  label,
  htmlFor,
  obrigatorio,
  ajuda,
  children,
}: {
  label: string
  htmlFor: string
  obrigatorio?: boolean
  ajuda?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-grafite-800">
        {label}
        {obrigatorio && <span className="text-prata-500"> *</span>}
      </label>
      {children}
      {ajuda && <p className="mt-1 text-xs text-prata-500">{ajuda}</p>}
    </div>
  )
}
