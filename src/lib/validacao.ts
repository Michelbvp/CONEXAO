import { z } from 'zod'

// Toda entrada vinda do cliente (API routes) passa por aqui antes de tocar
// o banco — é a nossa "fronteira de confiança" (ver OWASP: validação de
// entrada no servidor, nunca confiar só na validação do formulário).

const tiposContatoValidos = [
  'CAFE',
  'LIGACAO',
  'VIDEOCHAMADA',
  'ALMOCO',
  'JANTAR',
  'EMAIL',
  'MENSAGEM',
  'ENCONTRO_PRESENCIAL',
] as const

// Um campo de texto opcional. Aceita string vazia (formulário HTML) e,
// principalmente, também `null` — que é o que `FormData.get('campo')`
// devolve quando o campo simplesmente não existe naquele formulário. Sem
// isso, um formulário que não inclui um campo opcional (ex.: a tela de
// registrar contato não tem campo de "nota") faria a validação falhar.
function textoOpcional(tamanhoMaximo: number) {
  return z.preprocess(
    (valor) => (valor === null ? undefined : valor),
    z.string().trim().max(tamanhoMaximo).optional().or(z.literal('')),
  )
}

export const criarPessoaSchema = z.object({
  nome: z.string().trim().min(1, 'Informe um nome.').max(120),
  categoriaId: z.string().min(1, 'Selecione uma categoria.'),
  email: z.preprocess(
    (valor) => (valor === null || valor === '' ? undefined : valor),
    z.string().trim().email('E-mail inválido.').max(200).optional(),
  ),
  telefone: textoOpcional(40),
  notas: textoOpcional(2000),
  // `undefined` (campo não enviado) deixa o valor atual intacto na edição;
  // `null` (campo enviado vazio) limpa a cadência personalizada, voltando
  // a pessoa a usar o padrão da categoria.
  cadenciaDiasPersonalizada: z.preprocess(
    (valor) => (valor === '' ? null : valor),
    z.union([z.coerce.number().int().min(1).max(3650), z.null()]).optional(),
  ),
})

export const atualizarPessoaSchema = criarPessoaSchema.partial().extend({
  arquivar: z.boolean().optional(),
})

export const criarInteracaoSchema = z.object({
  pessoaId: z.string().min(1),
  tipo: z.enum(tiposContatoValidos),
  data: z.preprocess((valor) => (valor === null || valor === '' ? undefined : valor), z.coerce.date().optional()),
  nota: textoOpcional(2000),
})

export const responderSugestaoSchema = z.object({
  acao: z.enum(['confirmar', 'recusar']),
})

export const criarCategoriaSchema = z.object({
  nome: z.string().trim().min(1, 'Informe um nome.').max(60),
  icone: z.preprocess(
    (valor) => (valor === null || valor === '' ? undefined : valor),
    z.string().trim().max(8).optional(),
  ),
  cadenciaDiasPadrao: z.coerce.number().int().min(1, 'A cadência precisa ser de pelo menos 1 dia.').max(3650),
  // Vem do formulário como uma lista de checkboxes marcadas; guardamos como
  // texto separado por vírgula no banco (ver Categoria.tiposPreferidos).
  tiposPreferidos: z
    .array(z.enum(tiposContatoValidos))
    .min(1, 'Selecione ao menos um tipo de contato preferido.'),
})

export const atualizarCategoriaSchema = criarCategoriaSchema.partial()
