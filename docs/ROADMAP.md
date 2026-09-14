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

## Iteração 2 — concluída

- Tela de **edição** de pessoa, incluindo cadência personalizada.
- Tela de **configurações de categoria** (renomear, ajustar cadência
  padrão e tipos de contato preferidos, criar/excluir categorias).

Ainda pendente desta iteração (fica para uma próxima):
- Tela de **"Minha conta"** com o botão de excluir conta (hoje a exclusão
  já existe como rota de API, mas sem botão na interface).
- Paginação/filtro no painel quando houver muitas pessoas cadastradas.

## Iteração 3 — Google Calendário — concluída

- Ao confirmar uma sugestão de contato, o usuário escolhe a data/horário e
  o app cria automaticamente um evento no Google Calendário principal dele
  (ex.: "Café com Ana Beatriz"), com um link de volta para o evento visível
  no histórico da pessoa.
- Pede o escopo adicional `https://www.googleapis.com/auth/calendar.events`
  (o mais restrito que o Google oferece para eventos) no login com Google —
  quem já tinha conectado a conta antes precisa sair e entrar de novo para
  conceder esse escopo.
- Se o usuário não conectou o Google, ou se a chamada à API do Google
  falhar por qualquer motivo, o contato é registrado normalmente mesmo
  assim — a integração nunca bloqueia a funcionalidade principal.
- Tokens de acesso são renovados sozinhos (usando o refresh_token obtido no
  login) — ver `src/lib/googleCalendar.ts`.

## Iteração 3.5 — Agendamentos — concluída

- **Registrar um contato pela tela da pessoa e confirmar uma sugestão
  seguem exatamente a mesma regra agora**: escolher uma data/horário no
  **futuro** não vai mais direto pro histórico — cria um **Agendamento**
  (status "Agendado"), que fica ativo esperando o usuário dizer o que
  aconteceu. Escolher agora/passado continua indo direto pro histórico,
  como antes — e em ambos os casos, com sincronização no Google
  Calendário (se a conta estiver conectada).
- Um Agendamento pendente aparece no painel principal (card da pessoa) e
  na página da pessoa, com três ações:
  - **Realizado** → cria a interação de verdade no histórico;
  - **Reagendar** → só muda a data/horário (continua Agendado), e atualiza
    o evento correspondente no Google Calendário;
  - **Cancelar** → fecha o agendamento sem virar uma interação; aparece no
    histórico da pessoa marcado como "Cancelado" (mantém o registro do que
    foi combinado e não aconteceu), e remove o evento do Google Calendário.
- Nova página **Agenda** (link no cabeçalho): lista os agendamentos dos
  próximos 7 dias de todas as pessoas, com as mesmas três ações à mão —
  além de uma seção "Atrasados" para agendamentos cuja data já passou e
  ainda não foram resolvidos.
- Enquanto uma pessoa tem um agendamento pendente, o app não gera uma nova
  sugestão de contato pra ela (evita sugerir algo que já está marcado).

## Iteração 4 — Google Contatos — concluída

- Nova página **"Importar do Google Contatos"** (link a partir de "Nova
  pessoa"): lista os contatos do Google que ainda não foram trazidos para o
  Conexão, com busca por nome/e-mail/telefone, escolha de categoria por
  contato e um botão **Importar** individual — nada é importado
  automaticamente, o usuário escolhe um a um.
- Cada pessoa importada guarda o `googleContactId` (campo já existente no
  banco desde a Iteração 1), o que impede importar o mesmo contato duas
  vezes — a rota `POST /api/pessoas` recusa uma segunda tentativa com o
  mesmo id.
- Foto de perfil do contato (quando existir no Google) é trazida junto,
  usando o campo `fotoUrl` já existente.
- Só leitura: o app nunca cria, altera ou apaga nada nos contatos do
  usuário no Google — usa a Google People API (`people.connections.list`)
  apenas para listar.
- Pede o escopo adicional
  `https://www.googleapis.com/auth/contacts.readonly` (o mais restrito que
  o Google oferece para leitura de contatos) no login com Google — quem já
  tinha conectado a conta antes precisa sair e entrar de novo para
  conceder esse escopo.
- Se o usuário não conectou o Google, a página explica isso em vez de dar
  erro; se a chamada à API do Google falhar, mostra uma mensagem amigável
  e não afeta o resto do app.

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
