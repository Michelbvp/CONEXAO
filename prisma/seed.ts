// Script de dados de exemplo (seed), útil para ver o app funcionando sem
// precisar cadastrar pessoas manualmente. Rode com: npm run db:seed
//
// Cria (ou reaproveita) um usuário de demonstração com e-mail
// "demo@conexao.app" — o mesmo usuário usado pelo login de demonstração em
// desenvolvimento (ver src/lib/auth.ts e ALLOW_DEMO_LOGIN no .env).
import { PrismaClient, TipoContato } from '@prisma/client'
import { CATEGORIAS_PADRAO } from '../src/lib/onboarding'

const prisma = new PrismaClient()

function diasAtras(dias: number): Date {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return data
}

async function main() {
  const usuario = await prisma.user.upsert({
    where: { email: 'demo@conexao.app' },
    update: {},
    create: {
      email: 'demo@conexao.app',
      name: 'Conta Demonstração',
    },
  })

  // Recria pessoas e categorias do zero para manter o seed reprodutível.
  // Pessoa referencia Categoria, então precisa ser apagada primeiro (senão
  // a chave estrangeira barra o "delete" da categoria).
  await prisma.pessoa.deleteMany({ where: { userId: usuario.id } })
  await prisma.categoria.deleteMany({ where: { userId: usuario.id } })
  const categorias = await Promise.all(
    CATEGORIAS_PADRAO.map((c, indice) =>
      prisma.categoria.create({
        data: {
          userId: usuario.id,
          nome: c.nome,
          icone: c.icone,
          cadenciaDiasPadrao: c.cadenciaDiasPadrao,
          tiposPreferidos: c.tiposPreferidos,
          ordem: indice,
        },
      }),
    ),
  )

  const categoriaPorNome = Object.fromEntries(categorias.map((c) => [c.nome, c]))

  const pessoasExemplo = [
    {
      nome: 'Ana Beatriz Souza',
      categoria: 'Mentor',
      email: 'ana.souza@example.com',
      ultimoContato: { tipo: TipoContato.CAFE, diasAtras: 52 },
    },
    {
      nome: 'Carlos Eduardo Lima',
      categoria: 'Colegas de Trabalho',
      email: 'carlos.lima@example.com',
      ultimoContato: { tipo: TipoContato.ALMOCO, diasAtras: 10 },
    },
    {
      nome: 'Fernanda Ribeiro',
      categoria: 'Colegas de Trabalho',
      email: 'fernanda.ribeiro@example.com',
      ultimoContato: null, // nunca houve contato registrado ainda
    },
    {
      nome: 'Dona Helena (mãe)',
      categoria: 'Família',
      telefone: '+55 11 90000-0000',
      cadenciaDiasPersonalizada: 7,
      ultimoContato: { tipo: TipoContato.LIGACAO, diasAtras: 20 },
    },
    {
      nome: 'Pedro Henrique (irmão)',
      categoria: 'Família',
      ultimoContato: { tipo: TipoContato.VIDEOCHAMADA, diasAtras: 6 },
    },
  ]

  for (const p of pessoasExemplo) {
    const categoria = categoriaPorNome[p.categoria]
    if (!categoria) continue

    const pessoa = await prisma.pessoa.create({
      data: {
        userId: usuario.id,
        nome: p.nome,
        email: 'email' in p ? p.email : undefined,
        telefone: 'telefone' in p ? p.telefone : undefined,
        categoriaId: categoria.id,
        cadenciaDiasPersonalizada:
          'cadenciaDiasPersonalizada' in p ? p.cadenciaDiasPersonalizada : undefined,
      },
    })

    if (p.ultimoContato) {
      await prisma.interacao.create({
        data: {
          pessoaId: pessoa.id,
          tipo: p.ultimoContato.tipo,
          data: diasAtras(p.ultimoContato.diasAtras),
          origem: 'MANUAL',
        },
      })
    }
  }

  console.log('Seed concluído. Usuário de demonstração:', usuario.email)
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
