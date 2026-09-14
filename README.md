# Conexão

Aplicativo web responsivo para ajudar você a cultivar os relacionamentos
mais importantes da sua vida — mentores, colegas de trabalho e família —
lembrando de manter contato direto com cada pessoa, no ritmo certo para
cada relação.

Este repositório é também um material de estudo: os comentários no código
explicam **por quê** as coisas foram feitas de determinado jeito (não só
"o quê"), e este README documenta as decisões de arquitetura para quem
está aprendendo a partir do projeto.

## O que o app faz (iteração atual)

- Organiza as pessoas do seu círculo em **categorias** (por padrão:
  Mentor, Colegas de Trabalho e Família — você pode criar outras).
- Mostra, para cada pessoa, **há quanto tempo e por qual meio** foi o
  último contato direto.
- **Sugere** o próximo contato (café, ligação, videochamada, almoço,
  jantar, e-mail...) com base numa cadência configurável por categoria —
  e **nunca agenda nada sozinho**: toda sugestão fica pendente até você
  confirmar ou recusar.
- Confirmar uma sugestão para uma data **futura** cria um **agendamento**
  (não vai direto pro histórico) — que fica esperando você marcar como
  **realizado**, **reagendar** ou **cancelar**. Uma página **Agenda**
  mostra os agendamentos dos próximos 7 dias.
- Login com **Google** ou **Facebook** (e um modo de demonstração só para
  testar localmente, sem precisar configurar nada — veja `docs/DEPLOY.md`).
- Ao confirmar/realizar um contato, cria um **evento no Google Calendário**
  do usuário na data/horário escolhido (se a conta Google estiver
  conectada) — e mantém o evento em dia se o contato for reagendado ou
  cancelado.
- **Importar do Google Contatos**: sugere pessoas já cadastradas no seu
  Google para trazer para o Conexão — você escolhe uma a uma quem importar
  (nada é trazido automaticamente).
- As sugestões de contato são geradas **automaticamente todo dia** (job
  agendado), mesmo que você não abra o app naquele dia — e quando surge
  alguma nova, chega um **e-mail de lembrete** (opcional, via Resend).

A sincronização com Google Fotos foi avaliada e **abortada** (ver
`docs/ROADMAP.md`, Iteração 5): o Google descontinuou o jeito simples de
fazer isso em 2025, e o substituto exigiria uma complexidade que não vale
a pena para este projeto por enquanto.

## Stack escolhida e por quê

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | [Next.js](https://nextjs.org) (React + TypeScript) | Um único projeto cobre front-end e back-end (API routes), o que simplifica muito para quem está começando. É o framework com melhor suporte nativo na Vercel. |
| Estilo | [Tailwind CSS](https://tailwindcss.com) | Permite montar a identidade visual (paleta sóbria, botões em pílula, tipografia) direto nos componentes, sem precisar manter arquivos CSS separados espalhados pelo projeto. |
| Banco de dados | PostgreSQL | Banco relacional maduro, gratuito em provedores como Neon/Supabase, e o mais bem suportado pela Vercel. |
| Acesso ao banco | [Prisma](https://www.prisma.io) | ORM que gera tipos TypeScript automaticamente a partir do `schema.prisma`, evitando SQL escrito à mão e erros de digitação em nomes de coluna. |
| Autenticação | [NextAuth.js](https://next-auth.js.org) | Biblioteca padrão do ecossistema Next.js para login social (OAuth) com Google/Facebook, cuida de cookies, tokens e segurança de sessão. |
| Validação de dados | [Zod](https://zod.dev) | Garante, no servidor, que os dados recebidos em cada rota de API têm o formato esperado antes de tocar o banco. |
| Hospedagem | [Vercel](https://vercel.com) (plano gratuito) | Publica automaticamente a cada `git push`, HTTPS incluso, feito pela mesma empresa do Next.js. Ver `docs/DEPLOY.md` para o passo a passo. |

## Estrutura do projeto

```
prisma/
  schema.prisma      → modelo de dados (usuários, categorias, pessoas, interações, sugestões)
  seed.ts             → dados de exemplo para testar o app localmente

src/
  app/                → páginas e rotas de API (Next.js App Router)
    page.tsx           → painel principal
    login/              → tela de login
    pessoas/            → cadastro e detalhe de pessoa
    api/                → back-end: autenticação, pessoas, interações, sugestões, conta

  components/         → componentes de interface reutilizáveis
    ui/                 → peças básicas do design system (Botao, Cartao, SeloStatus, Avatar)

  lib/                 → lógica de negócio e utilitários
    cadencia.ts          → regra de quando sugerir um novo contato
    dashboard.ts          → monta os dados prontos para a tela principal
    auth.ts                → configuração do login (NextAuth)
    validacao.ts            → validação de entrada das rotas de API (Zod)

docs/
  DEPLOY.md            → como rodar localmente e publicar de graça
  PRIVACIDADE.md         → como o app trata dados pessoais (LGPD)
  ROADMAP.md               → próximas iterações planejadas
```

## Como rodar o projeto

Veja o passo a passo completo, do zero, em **[docs/DEPLOY.md](docs/DEPLOY.md)**.
Resumo rápido para quem já tem Node.js instalado:

```bash
npm install
cp .env.example .env   # depois edite o .env com suas próprias chaves
npm run db:push
npm run db:seed        # opcional: popula com dados de exemplo
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e use o botão **"Entrar
em modo demonstração"** para ver o app funcionando sem precisar configurar
Google/Facebook ainda.

## Segurança e privacidade

- Nenhuma senha é armazenada pelo app — o login é sempre delegado ao Google
  ou Facebook (protocolo OAuth 2.0 / OpenID Connect).
- Segredos (chaves de API, string de conexão do banco) sempre em variáveis
  de ambiente, nunca no código-fonte (`.env` está no `.gitignore`).
- Toda rota de API confere se o dado pertence ao usuário autenticado antes
  de devolver ou alterar qualquer coisa (evita acesso indevido entre
  contas — categoria OWASP "Broken Access Control").
- Cabeçalhos de segurança HTTP configurados em `next.config.js`.
- Conformidade com a LGPD detalhada em **[docs/PRIVACIDADE.md](docs/PRIVACIDADE.md)**,
  incluindo como o usuário pode excluir todos os seus dados.

## Design

- Paleta em tons de preto, cinza, prata e branco (`tailwind.config.ts`,
  cores `grafite`, `prata` e `marfim`) — sem cores de destaque saturadas.
- Botões sempre em formato de pílula (`rounded-pill`).
- Tipografia sans-serif do sistema operacional, responsiva; negrito
  reservado a títulos e subtítulos (`src/app/globals.css`).
- Status de contato (em dia/atenção/atrasado) comunicado por **intensidade
  de cinza + texto**, não por cor — mantém a identidade minimalista e
  ainda assim é acessível (não depende só de percepção de cor).

## Próximos passos

Este projeto evolui em iterações pequenas — veja o plano em
**[docs/ROADMAP.md](docs/ROADMAP.md)**. Peça a próxima mudança quando
quiser; cada iteração costuma virar um commit (ou um conjunto pequeno de
commits) nesta mesma branch de trabalho.
