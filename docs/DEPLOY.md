# Guia de instalação e deploy

Este guia assume que você nunca fez isso antes — vamos passo a passo.

## 1. Rodando localmente (na sua máquina)

### Pré-requisitos

- [Node.js](https://nodejs.org) versão 20 ou superior instalado.
- Um editor de código, como o [VS Code](https://code.visualstudio.com).

### Passo a passo

1. Clone o repositório e entre na pasta:
   ```bash
   git clone https://github.com/michelbvp/conexao.git
   cd conexao
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo de variáveis de ambiente de exemplo:
   ```bash
   cp .env.example .env
   ```
4. Gere um valor aleatório para `NEXTAUTH_SECRET` e cole no `.env`:
   ```bash
   openssl rand -base64 32
   ```
5. Crie um banco PostgreSQL gratuito (recomendado: [neon.tech](https://neon.tech),
   veja o passo 3 abaixo) e cole a "connection string" dele em `DATABASE_URL`
   no `.env`. Se preferir testar rapidinho sem criar conta em lugar nenhum,
   você pode instalar o Postgres localmente, mas o caminho mais simples para
   quem está começando é o Neon.
6. Crie as tabelas no banco a partir do schema do Prisma:
   ```bash
   npm run db:push
   ```
7. (Opcional, mas recomendado) Popule o banco com dados de exemplo:
   ```bash
   npm run db:seed
   ```
8. Rode o app em modo desenvolvimento:
   ```bash
   npm run dev
   ```
9. Abra [http://localhost:3000](http://localhost:3000). Como
   `ALLOW_DEMO_LOGIN="true"` já vem no `.env.example`, você pode clicar em
   **"Entrar em modo demonstração"** e já ver o app funcionando com os dados
   de exemplo do seed — sem precisar configurar Google/Facebook ainda.

A partir daqui, qualquer alteração que eu (o Claude) fizer no código, ou que
você mesmo fizer, aparece automaticamente ao salvar o arquivo (o `next dev`
recarrega sozinho).

## 2. Configurando login com Google (Calendário e Contatos)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/) e crie
   um novo projeto (ou use um existente).
2. Vá em **APIs e serviços → Biblioteca**, procure por **"Google Calendar
   API"** e clique em **Ativar**. Sem esse passo, criar eventos vai falhar
   com um erro dizendo que a API não está habilitada no projeto.
   - Repita a busca por **"Google People API"** e ative também — é a API
     usada para ler seus contatos na tela "Importar do Google Contatos"
     (só leitura, ver `docs/PRIVACIDADE.md`).
3. No menu, vá em **APIs e serviços → Tela de consentimento OAuth**.
   - Tipo de usuário: **Externo**.
   - Preencha nome do app ("Conexão"), e-mail de suporte e e-mail de
     contato do desenvolvedor (o seu, michelbvp@gmail.com).
   - Em "Escopos", clique em "Adicionar ou remover escopos" e adicione:
     `.../auth/calendar.events` (o Conexão usa esse escopo para criar
     eventos quando você confirma uma sugestão de contato) e
     `.../auth/contacts.readonly` (usado só para listar seus contatos na
     tela de importação — ver `docs/PRIVACIDADE.md`). O Google classifica
     esses escopos como "sensíveis"; para uso pessoal em modo de teste isso
     não é um problema, só é relevante se um dia o app for publicado para o
     público em geral (aí o Google exige um processo de verificação).
   - Em "Usuários de teste" (enquanto o app não estiver "publicado"),
     adicione seu próprio e-mail do Google.
4. Vá em **APIs e serviços → Credenciais → Criar credenciais → ID do
   cliente OAuth**.
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Em "Origens JavaScript autorizadas", adicione:
     - `http://localhost:3000` (para testar localmente)
     - a URL do seu app publicado (depois que você fizer o deploy, ex.:
       `https://conexao-seu-usuario.vercel.app`)
   - Em "URIs de redirecionamento autorizados", adicione:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://SEU-DOMINIO/api/auth/callback/google` (troque pelo domínio
       real depois do deploy)
5. Copie o **ID do cliente** e o **Segredo do cliente** gerados e cole em
   `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env` (localmente) e nas
   variáveis de ambiente da Vercel (em produção — ver seção 4).
6. Se você já tinha feito login com Google antes de configurar os escopos do
   Calendário/Contatos, saia da conta no Conexão (botão "Sair") e entre de
   novo — o Google só concede um escopo novo depois de um consentimento
   novo.

## 3. Configurando login com Facebook

1. Acesse [developers.facebook.com/apps](https://developers.facebook.com/apps)
   e crie um app do tipo **Consumidor**.
2. Adicione o produto **Facebook Login** ao app.
3. Em **Configurações → Básico**, copie o **ID do aplicativo** e a
   **Chave secreta do aplicativo** para `FACEBOOK_CLIENT_ID` e
   `FACEBOOK_CLIENT_SECRET`.
4. Em **Facebook Login → Configurações**, adicione em "URIs de redirecionamento
   do OAuth válidos":
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://SEU-DOMINIO/api/auth/callback/facebook`
5. Enquanto o app estiver em modo de desenvolvimento no Facebook, só contas
   adicionadas como testadoras/administradoras conseguem logar — é preciso
   solicitar revisão do app ao Facebook para abrir para qualquer pessoa.

## 4. Criando o banco de dados gratuito (Neon)

1. Crie uma conta em [neon.tech](https://neon.tech) (tem plano gratuito
   generoso, ideal para começar).
2. Crie um novo projeto/banco chamado, por exemplo, `conexao`.
3. No painel do Neon, copie a "Connection string" (formato
   `postgresql://usuario:senha@host/banco?sslmode=require`).
4. Use esse valor como `DATABASE_URL`, tanto no `.env` local quanto nas
   variáveis de ambiente da Vercel.

Alternativa equivalente: [Supabase](https://supabase.com) também oferece
Postgres gratuito e funciona da mesma forma.

## 5. Publicando o app (deploy) na Vercel

A Vercel foi escolhida por ser a hospedagem mais simples para apps Next.js,
com plano gratuito (Hobby) suficiente para uso pessoal, e por publicar uma
nova versão automaticamente a cada `git push` — o que combina bem com o
plano de "aplicar iterações aos poucos".

1. Crie uma conta em [vercel.com](https://vercel.com) (pode entrar direto
   com sua conta do GitHub).
2. Clique em **Add New → Project** e selecione o repositório
   `michelbvp/conexao` no GitHub.
3. A Vercel detecta automaticamente que é um projeto Next.js — não precisa
   mudar nada nas configurações de build.
4. Em **Environment Variables**, adicione todas as variáveis do seu `.env`
   local (`DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`,
   `CRON_SECRET`).
   - **Não** adicione `ALLOW_DEMO_LOGIN` em produção (ou deixe como
     `false`) — o login de demonstração deve existir só localmente.
   - `NEXTAUTH_URL` deve ser a URL final do seu app, ex.:
     `https://conexao-seu-usuario.vercel.app`.
   - `CRON_SECRET` protege o job diário que gera sugestões de contato (ver
     `docs/ROADMAP.md`, Iteração 6) — gere um valor aleatório forte (ex.:
     `openssl rand -base64 32`). A própria Vercel detecta o arquivo
     `vercel.json` do repositório e agenda o job sozinha; não precisa
     configurar nada além dessa variável.
5. Clique em **Deploy**. Em poucos minutos o app estará no ar com uma URL
   pública.
6. Depois do primeiro deploy, volte ao Google Cloud Console e ao Facebook
   Developers (seções 2 e 3) e adicione a URL real do app nas listas de
   origens/redirecionamentos autorizados.
7. Rode as migrações do banco de produção uma vez (pode ser da sua própria
   máquina, apontando `DATABASE_URL` para o banco de produção):
   ```bash
   npm run db:push
   ```

Depois desse primeiro deploy, o fluxo do dia a dia passa a ser: peça uma
alteração, eu (Claude) atualizo o código e crio um commit na branch de
trabalho; quando você aprovar e isso for mesclado na branch principal
(`main`), a Vercel publica a nova versão sozinha.
