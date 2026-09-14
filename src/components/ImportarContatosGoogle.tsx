'use client'

import { useMemo, useState } from 'react'

import { Avatar } from '@/components/ui/Avatar'
import { Botao } from '@/components/ui/Botao'
import { Cartao } from '@/components/ui/Cartao'
import type { ContatoGoogle } from '@/lib/googleContacts'

type CategoriaOpcao = { id: string; nome: string; icone: string }

type EstadoLinha = 'pendente' | 'importando' | 'importado' | 'erro'

export function ImportarContatosGoogle({
  contatos,
  categorias,
}: {
  contatos: ContatoGoogle[]
  categorias: CategoriaOpcao[]
}) {
  const [busca, setBusca] = useState('')
  const [categoriaEscolhida, setCategoriaEscolhida] = useState<Record<string, string>>({})
  const [estado, setEstado] = useState<Record<string, EstadoLinha>>({})

  const categoriaPadrao = categorias[0]?.id ?? ''

  const contatosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return contatos
    return contatos.filter(
      (contato) =>
        contato.nome.toLowerCase().includes(termo) ||
        contato.email?.toLowerCase().includes(termo) ||
        contato.telefone?.toLowerCase().includes(termo),
    )
  }, [contatos, busca])

  async function importar(contato: ContatoGoogle) {
    const categoriaId = categoriaEscolhida[contato.resourceName] ?? categoriaPadrao
    if (!categoriaId) return

    setEstado((atual) => ({ ...atual, [contato.resourceName]: 'importando' }))
    try {
      const resposta = await fetch('/api/pessoas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: contato.nome,
          categoriaId,
          email: contato.email,
          telefone: contato.telefone,
          fotoUrl: contato.fotoUrl,
          googleContactId: contato.resourceName,
        }),
      })
      if (!resposta.ok) throw new Error()
      setEstado((atual) => ({ ...atual, [contato.resourceName]: 'importado' }))
    } catch {
      setEstado((atual) => ({ ...atual, [contato.resourceName]: 'erro' }))
    }
  }

  if (contatos.length === 0) {
    return (
      <Cartao className="p-6 text-sm text-grafite-700">
        Não encontramos novos contatos para sugerir — ou você já importou todo mundo, ou sua lista
        de contatos do Google está vazia.
      </Cartao>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={busca}
        onChange={(evento) => setBusca(evento.target.value)}
        placeholder="Buscar por nome, e-mail ou telefone…"
        className="campo-texto"
      />

      <ul className="flex flex-col gap-3">
        {contatosFiltrados.map((contato) => {
          const linhaEstado = estado[contato.resourceName] ?? 'pendente'
          return (
            <li key={contato.resourceName}>
              <Cartao className="flex flex-wrap items-center gap-3 p-4">
                <Avatar nome={contato.nome} fotoUrl={contato.fotoUrl} tamanho={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-grafite-900">{contato.nome}</p>
                  <p className="truncate text-xs text-prata-500">
                    {[contato.email, contato.telefone].filter(Boolean).join(' · ') || 'Sem e-mail ou telefone'}
                  </p>
                </div>

                {linhaEstado === 'importado' ? (
                  <span className="text-sm text-grafite-700">Importado ✓</span>
                ) : (
                  <>
                    <select
                      className="campo-texto w-auto"
                      value={categoriaEscolhida[contato.resourceName] ?? categoriaPadrao}
                      onChange={(evento) =>
                        setCategoriaEscolhida((atual) => ({
                          ...atual,
                          [contato.resourceName]: evento.target.value,
                        }))
                      }
                      disabled={linhaEstado === 'importando'}
                    >
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.icone} {categoria.nome}
                        </option>
                      ))}
                    </select>
                    <Botao
                      type="button"
                      tamanho="sm"
                      disabled={linhaEstado === 'importando' || !categoriaPadrao}
                      onClick={() => importar(contato)}
                    >
                      {linhaEstado === 'importando' ? 'Importando…' : 'Importar'}
                    </Botao>
                    {linhaEstado === 'erro' && (
                      <p className="w-full text-xs text-grafite-800">
                        Não foi possível importar. Tente novamente.
                      </p>
                    )}
                  </>
                )}
              </Cartao>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
