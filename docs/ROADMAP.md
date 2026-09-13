# Roteiro de iterações

Este projeto foi combinado para evoluir aos poucos. Esta é a base (iteração
1) e a lista do que dá para vir a seguir, em ordem sugerida de valor/
esforço. Nada aqui é compromisso fechado — é só um mapa para orientar os
próximos pedidos.

## Iteração 1 — concluída (esta entrega)

- Estrutura do projeto (Next.js + TypeScript + Tailwind + Prisma).
- Modelo de dados: usuários, categorias, pessoas, interações e sugestões.
- Autenticação por login social (Google e Facebook), com modo de
  demonstração para testar sem configurar credenciais ainda.
- Painel principal com pessoas agrupadas por categoria, status visual de
  "em dia / atenção / atrasado" e sugestões de contato pendentes de
  confirmação.
- Cadastro de pessoas, registro manual de contatos e histórico por pessoa.
- Documentação de instalação, deploy gratuito e privacidade/LGPD.

## Iteração 2 — sugestões

- Tela de **edição** de pessoa (hoje só existe criação e arquivamento).
- Tela de **configurações de categoria** (renomear, ajustar cadência
  padrão e tipos de contato preferidos pela própria interface, sem precisar
  mexer no banco).
- Tela de **"Minha conta"** com o botão de excluir conta (hoje a exclusão
  já existe como rota de API, mas sem botão na interface).
- Paginação/filtro no painel quando houver muitas pessoas cadastradas.

## Iteração 3 — Google Calendário

- Ao confirmar uma sugestão de contato, criar automaticamente um evento no
  Google Calendário do usuário (ex.: "Café com Ana Beatriz"), com a opção
  de escolher data/horário na hora da confirmação.
- Exige pedir o escopo adicional `https://www.googleapis.com/auth/calendar.events`
  no login com Google — só nesse momento, de forma explícita.

## Iteração 4 — Google Contatos

- Importar pessoas existentes do Google Contatos como sugestão de cadastro
  (o usuário escolhe quem trazer para o Conexão, não é importado tudo
  automaticamente).
- Guardar o `googleContactId` (campo já existente no banco) para manter a
  ligação entre a pessoa no Conexão e o contato no Google.
- Escopo adicional: `https://www.googleapis.com/auth/contacts.readonly`.

## Iteração 5 — Google Fotos

- Permitir escolher uma foto do Google Fotos como foto de perfil de uma
  pessoa cadastrada (hoje o campo `fotoUrl` já existe no banco, mas só é
  preenchido pela foto de perfil do próprio usuário logado).
- Escopo adicional: `https://www.googleapis.com/auth/photoslibrary.readonly`.

## Iteração 6 — sugestões automáticas em segundo plano

- Hoje as sugestões são geradas quando o painel é carregado. Migrar para um
  job agendado (Vercel Cron, 1x por dia) que gera as sugestões mesmo que o
  usuário não abra o app naquele dia, e opcionalmente envia um lembrete por
  e-mail/notificação.

## Iteração 7 — notificações

- E-mail (ou notificação push, se o app virar PWA) quando surgir uma nova
  sugestão de contato pendente, para o usuário não depender de abrir o app
  para lembrar.

## Ideias de mais longo prazo (sem prioridade definida ainda)

- Estatísticas simples (ex.: quantos contatos por categoria no mês).
- Exportar os dados cadastrados (CSV) — reforça o direito de portabilidade
  da LGPD.
- Modo escuro (mantendo a paleta preto/cinza/prata/branco).
