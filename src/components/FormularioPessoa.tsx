'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import { Botao } from '@/components/ui/Botao'

type CategoriaOpcao = { id: string; nome: string; icone: string }

export function FormularioPessoa({ categorias }: { categorias: CategoriaOpcao[] }) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)

    const formulario = new FormData(evento.currentTarget)
    const corpo = {
      nome: formulario.get('nome'),
      categoriaId: formulario.get('categoriaId'),
      email: formulario.get('email'),
      telefone: formulario.get('telefone'),
      notas: formulario.get('notas'),
    }

    try {
      const resposta = await fetch('/api/pessoas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null)
        throw new Error(dados?.erro ?? 'Não foi possível salvar.')
      }
      router.push('/')
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
        />
      </Campo>

      <Campo label="Categoria" htmlFor="categoriaId" obrigatorio>
        <select id="categoriaId" name="categoriaId" required className="campo-texto">
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.icone} {categoria.nome}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="E-mail" htmlFor="email">
        <input id="email" name="email" type="email" maxLength={200} className="campo-texto" />
      </Campo>

      <Campo label="Telefone" htmlFor="telefone">
        <input id="telefone" name="telefone" maxLength={40} className="campo-texto" />
      </Campo>

      <Campo label="Notas" htmlFor="notas">
        <textarea id="notas" name="notas" rows={3} maxLength={2000} className="campo-texto" />
      </Campo>

      {erro && <p className="text-sm text-grafite-800">{erro}</p>}

      <div className="flex gap-3">
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar pessoa'}
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
  children,
}: {
  label: string
  htmlFor: string
  obrigatorio?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-grafite-800">
        {label}
        {obrigatorio && <span className="text-prata-500"> *</span>}
      </label>
      {children}
    </div>
  )
}
