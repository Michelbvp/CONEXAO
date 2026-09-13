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
- **Fora do escopo por enquanto**: contatos registrados manualmente (fora
  do fluxo de confirmar sugestão) não criam evento no Google Calendário.

## Iteração 3.5 — Agendamentos — concluída

- Confirmar uma sugestão com data/horário no **futuro** não vai mais direto
  pro histórico: cria um **Agendamento** (status "Agendado"), que fica
  ativo esperando o usuário dizer o que aconteceu. Confirmar para
  agora/passado continua indo direto pro histórico, como antes.
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
