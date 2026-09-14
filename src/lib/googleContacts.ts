// ============================================================================
// Integração com o Google Contatos (People API).
// ----------------------------------------------------------------------------
// Só LEITURA: o app nunca cria, altera ou apaga nada nos contatos do
// usuário — só lista, para o próprio usuário escolher quem trazer para o
// Conexão (ver src/app/pessoas/importar/page.tsx). Nada é importado
// automaticamente.
// ============================================================================

import { obterAccessTokenGoogleValido } from '@/lib/googleTokens'

const GOOGLE_PEOPLE_CONNECTIONS_URL = 'https://people.googleapis.com/v1/people/me/connections'

export type ContatoGoogle = {
  /** Ex.: "people/c1234567890" — identificador estável do contato no Google, guardado em Pessoa.googleContactId. */
  resourceName: string
  nome: string
  email: string | null
  telefone: string | null
  fotoUrl: string | null
}

export type ResultadoContatosGoogle =
  | { status: 'sem_google' }
  | { status: 'sucesso'; contatos: ContatoGoogle[] }
  | { status: 'erro'; motivo: string }

type PessoaGoogleApi = {
  resourceName: string
  names?: { displayName?: string }[]
  emailAddresses?: { value?: string }[]
  phoneNumbers?: { value?: string }[]
  photos?: { url?: string; default?: boolean }[]
}

/**
 * Lista os contatos do Google do usuário (nome, e-mail, telefone e foto).
 * Nunca lança exceção — qualquer problema volta como
 * `{ status: 'erro' | 'sem_google' }` para a página decidir o que mostrar.
 */
export async function listarContatosGoogle(userId: string): Promise<ResultadoContatosGoogle> {
  try {
    const accessToken = await obterAccessTokenGoogleValido(userId)
    if (!accessToken) return { status: 'sem_google' }

    const contatos: ContatoGoogle[] = []
    let pageToken: string | undefined

    do {
      const url = new URL(GOOGLE_PEOPLE_CONNECTIONS_URL)
      url.searchParams.set('personFields', 'names,emailAddresses,phoneNumbers,photos')
      url.searchParams.set('pageSize', '300')
      if (pageToken) url.searchParams.set('pageToken', pageToken)

      const resposta = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (!resposta.ok) {
        const corpo = await resposta.text()
        console.error('Falha ao listar contatos do Google:', resposta.status, corpo)
        return { status: 'erro', motivo: `Google respondeu ${resposta.status}` }
      }

      const dados = (await resposta.json()) as { connections?: PessoaGoogleApi[]; nextPageToken?: string }
      for (const pessoa of dados.connections ?? []) {
        const nome = pessoa.names?.[0]?.displayName
        if (!nome) continue // sem nome não dá pra sugerir cadastro com sentido

        // Google sempre inclui uma foto "default" (silhueta genérica) quando
        // a pessoa não tem foto de verdade — preferimos uma foto real, e só
        // usamos a genérica como último recurso (ainda melhor que nenhuma).
        const fotoReal = pessoa.photos?.find((f) => !f.default)
        const foto = fotoReal ?? pessoa.photos?.[0]

        contatos.push({
          resourceName: pessoa.resourceName,
          nome,
          email: pessoa.emailAddresses?.[0]?.value ?? null,
          telefone: pessoa.phoneNumbers?.[0]?.value ?? null,
          fotoUrl: foto?.url ?? null,
        })
      }
      pageToken = dados.nextPageToken
    } while (pageToken)

    contatos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    return { status: 'sucesso', contatos }
  } catch (erro) {
    console.error('Erro inesperado ao listar contatos do Google:', erro)
    return { status: 'erro', motivo: 'Erro inesperado' }
  }
}
