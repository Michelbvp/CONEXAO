# Privacidade e conformidade com a LGPD

Este documento explica, em linguagem simples, como o Conexão trata dados
pessoais e como ele se relaciona com a Lei Geral de Proteção de Dados
(LGPD — Lei nº 13.709/2018) e boas práticas internacionais equivalentes
(o RGPD/GDPR europeu segue os mesmos princípios gerais).

> Este documento é um guia de engenharia, não um parecer jurídico. Se o
> Conexão um dia sair do uso pessoal/estudo e for usado por terceiros de
> verdade, vale revisar com um profissional jurídico antes.

## Que dados o app trata

- **Dados de conta**: nome, e-mail e foto de perfil vindos do provedor de
  login (Google ou Facebook). O Conexão nunca vê nem guarda sua senha —
  quem autentica é o Google/Facebook (OAuth 2.0 / OpenID Connect).
- **Dados que você cadastra sobre outras pessoas**: nome, categoria,
  telefone, e-mail e notas livres de pessoas do seu círculo de
  relacionamento. Isso é dado pessoal de terceiros tratado por você,
  o "controlador" desses dados dentro do seu próprio uso do app.
- **Histórico de interações**: tipo e data dos contatos que você registra
  (ligação, café, etc.) — sem conteúdo da conversa, só metadados.
- **Eventos no Google Calendário**: quando você confirma uma sugestão de
  contato, o app cria um evento no seu próprio Google Calendário (título
  com o tipo de contato e o nome da pessoa, ex.: "Café com Ana Beatriz",
  na data/horário que você escolher). O app só **cria** eventos — nunca lê,
  lista ou altera outros eventos já existentes na sua agenda.
- **Leitura do Google Contatos**: na tela "Importar do Google Contatos", o
  app lista nome, e-mail, telefone e foto dos seus contatos do Google, só
  para você escolher quem trazer para o Conexão. Nada é importado
  automaticamente — só a pessoa que você clicar em "Importar" vira um
  registro no Conexão, e o app só **lê** contatos: nunca cria, altera ou
  apaga nada no Google Contatos.
- **E-mail de lembrete**: quando surgem novas sugestões de contato
  pendentes (geradas 1x por dia pelo job agendado, ver
  `docs/ROADMAP.md`), o app envia um e-mail resumindo quem está com contato
  em atraso/atenção, usando o serviço [Resend](https://resend.com) — um
  **operador** de dados nos termos da LGPD (art. 5º, VII), processando em
  nome do Conexão só o necessário para entregar esse e-mail (seu endereço e
  o texto do lembrete). Opcional: sem uma chave do Resend configurada, o
  app funciona normalmente e simplesmente não envia esse e-mail.

O app **não coleta** localização, dados biométricos, de saúde, ou
categorias de dados sensíveis (art. 5º, II, LGPD) — e não deve passar a
coletar sem que isso seja discutido explicitamente, dado que dados
sensíveis exigem base legal e cuidados redobrados.

## Base legal (art. 7º da LGPD)

- **Autenticação (Google/Facebook)**: consentimento do próprio titular ao
  fazer login e autorizar os escopos solicitados.
- **Criação de eventos no Google Calendário** e **leitura do Google
  Contatos**: consentimento explícito do próprio titular ao autorizar os
  escopos `calendar.events` e `contacts.readonly` no login com Google — ele
  pode revogar esse acesso a qualquer momento em
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions),
  sem precisar excluir a conta no Conexão.
- **Cadastro de pessoas do seu círculo**: legítimo interesse do usuário em
  organizar sua própria agenda de relacionamentos (art. 7º, IX) — dado que
  fica isolado à conta de quem cadastrou, sem entrar em contato direto com
  a pessoa cadastrada nem compartilhar isso com ela ou com terceiros.

## Princípios aplicados no código

- **Minimização**: só é pedido o dado estritamente necessário para a
  funcionalidade. O login com Google pede `openid email profile` (identidade),
  `calendar.events` (só eventos, não a agenda inteira nem outros dados da
  conta) e `contacts.readonly` (só leitura de contatos, sem permissão para
  alterá-los) — em ambos os casos, o escopo mais restrito que o Google
  oferece para a funcionalidade correspondente. O escopo de Fotos só será
  pedido quando essa integração existir de fato (ver `docs/ROADMAP.md`).
- **Isolamento por usuário**: toda tabela (`Pessoa`, `Categoria`,
  `Interacao`, `Sugestao`) está sempre filtrada por `userId` nas consultas
  e nas rotas de API validam que o registro pertence a quem fez a
  requisição antes de ler/alterar/apagar — evita o que a OWASP chama de
  IDOR (Insecure Direct Object Reference).
- **Eliminação**: `DELETE /api/conta` apaga a conta e, em cascata (definido
  no `prisma/schema.prisma` com `onDelete: Cascade`), todas as pessoas,
  categorias, interações e sugestões associadas — o "direito ao
  esquecimento" do art. 18, VI da LGPD.
- **Transporte seguro**: cabeçalhos de segurança (`next.config.js`) e HTTPS
  obrigatório em produção (Vercel serve tudo em HTTPS por padrão).
- **Segredos fora do código**: nenhuma credencial (client secret do Google/
  Facebook, string de conexão do banco, segredo de sessão) fica no
  repositório — tudo vem de variáveis de ambiente (`.env`, nunca commitado;
  ver `.gitignore`).
- **Tokens de acesso do Google**: guardados só no banco (tabela
  `contas_oauth`, gerenciada pelo NextAuth), nunca expostos ao navegador —
  toda chamada às APIs do Google Calendário e Contatos acontece no servidor
  (ver `src/lib/googleCalendar.ts` e `src/lib/googleContacts.ts`, que
  compartilham a renovação de token em `src/lib/googleTokens.ts`). Ficam
  protegidos pelas mesmas garantias de segurança do banco de dados (conexão
  criptografada, acesso restrito por credencial).
- **Minimização no e-mail de lembrete**: o Resend só recebe o necessário
  para entregar a mensagem (seu e-mail e o texto do lembrete) — nunca
  telefone, notas ou qualquer outro dado das pessoas cadastradas (ver
  `src/lib/email.ts`).

## Direitos do titular já cobertos pelo app

| Direito (art. 18 LGPD)              | Como é atendido hoje                                   |
| ------------------------------------ | -------------------------------------------------------- |
| Confirmação e acesso                 | Todos os dados aparecem no próprio painel do usuário     |
| Correção                             | Editar pessoa via API `PATCH /api/pessoas/:id`           |
| Eliminação                           | `DELETE /api/conta` remove tudo em cascata                |
| Revogação do consentimento           | Sair da conta + excluir; revogar acesso do app em myaccount.google.com/permissions |

## O que ainda não está implementado (e por quê)

- **Página de configurações de privacidade na própria UI** (hoje a exclusão
  de conta só existe como rota de API) — planejada no roadmap.
- **Registro de auditoria (log) de quem acessou o quê** — não é essencial
  enquanto o app for de uso pessoal/estudo, mas voltaria à mesa se o
  produto ganhasse múltiplos usuários "reais".
- **Criptografia adicional em repouso** para campos como telefone/e-mail de
  terceiros — hoje depende só da criptografia em repouso do próprio
  provedor de banco (Neon/Supabase já criptografam o disco). Se o app
  crescer, vale avaliar criptografia de campo específica para dados mais
  sensíveis.
