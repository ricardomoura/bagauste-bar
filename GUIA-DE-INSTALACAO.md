# Bagaúste Bar — Menu Digital · Guia de Instalação

Este projeto é uma aplicação web completa para o menu do **Bagaúste Bar**:

- **Menu público** bilingue (Português / Inglês), organizado por categorias, com foto, descrição e preço.
- **Backoffice** protegido por palavra-passe para gerir categorias e produtos a partir de qualquer dispositivo (telemóvel, tablet ou computador).
- **QR Code** para colocar nas mesas — os clientes leem-no e abrem o menu atualizado ao momento.

Tecnologia: **Next.js** (interface) + **Supabase** (base de dados, autenticação e fotos). Tudo pode funcionar em planos **gratuitos**.

Há dois passos principais: **(A)** criar a base de dados no Supabase e **(B)** publicar o site no Vercel. Não é preciso saber programar — basta seguir os passos.

---

## A. Criar a base de dados (Supabase) — ~10 minutos

1. Vá a **https://supabase.com** e crie uma conta gratuita.
2. Clique em **New project**. Dê um nome (ex.: `bagauste-bar`), defina uma *Database Password* (guarde-a) e escolha a região **West EU (London)** ou **Frankfurt** (mais perto de Portugal). Clique **Create new project** e aguarde ~2 min.
3. No menu lateral, abra **SQL Editor → New query**. Abra o ficheiro `supabase/schema.sql` deste projeto, copie **todo** o conteúdo, cole no editor e clique em **Run**. Isto cria as tabelas, as regras de segurança e o espaço para as fotos.

   **3b. Carregar o menu completo (opcional mas recomendado):** ainda no **SQL Editor → New query**, abra o ficheiro `supabase/seed.sql`, cole todo o conteúdo e clique em **Run**. Isto insere já as **18 categorias e 243 produtos** do menu do Bagaúste Bar, com preços em português e inglês. (Sem fotos — pode adicioná-las depois no backoffice, produto a produto.) Pode voltar a correr este ficheiro sempre que quiser repor o menu de origem: ele apaga o que existir e volta a inserir tudo.
4. Vá a **Project Settings (ícone de engrenagem) → API**. Aqui vai encontrar dois valores que precisa a seguir:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public** key (uma chave longa)

### Criar o utilizador do backoffice (o seu login)

5. No menu lateral, abra **Authentication → Users → Add user → Create new user**.
6. Introduza o **email** e a **palavra-passe** que quer usar para entrar no backoffice. Ative a opção **Auto Confirm User** (para não precisar de confirmar por email). Clique **Create user**.

> É com este email e palavra-passe que vai iniciar sessão em `/admin`.

---

## B. Publicar o site (Vercel) — ~10 minutos

A forma mais simples é através do GitHub. Se preferir não usar GitHub, veja a secção “Alternativa” mais abaixo.

1. Crie uma conta gratuita em **https://github.com** e uma em **https://vercel.com** (pode entrar no Vercel com a conta GitHub).
2. Crie um novo repositório no GitHub e envie para lá o conteúdo desta pasta. (Se usa a app do GitHub Desktop, basta arrastar a pasta.)
3. No Vercel, clique **Add New → Project**, escolha o repositório e clique **Import**.
4. Antes de clicar em **Deploy**, abra **Environment Variables** e adicione estas três:

   | Nome | Valor |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | o *Project URL* do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave *anon public* do Supabase |
   | `NEXT_PUBLIC_SITE_URL` | deixe em branco por agora (preenche no passo 6) |

5. Clique **Deploy** e aguarde. No fim, o Vercel dá-lhe um endereço, por exemplo `https://bagauste-bar.vercel.app`.
6. Copie esse endereço. Volte a **Settings → Environment Variables**, edite `NEXT_PUBLIC_SITE_URL` colocando esse endereço, e faça **Redeploy** (em Deployments → botão ⋯ → Redeploy). Isto garante que o QR Code aponta para o site correto.

Pronto! O menu está online.

- **Menu público:** `https://o-seu-endereco.vercel.app`
- **Backoffice:** `https://o-seu-endereco.vercel.app/admin`

---

## Como usar o backoffice

1. Aceda a `/admin` e inicie sessão com o email e palavra-passe que criou no Supabase.
2. **Nova categoria** — crie categorias (ex.: Vinhos do Douro, Petiscos, Sobremesas). Pode indicar o nome em português e inglês.
3. **Adicionar produto** — dentro de cada categoria, adicione produtos com nome, descrição (PT/EN), preço e foto (opcional).
4. Use **👁 Ocultar** para esconder temporariamente um produto ou categoria do menu sem o apagar (ex.: prato esgotado).
5. Separador **QR Code** — veja, descarregue e imprima o QR (PNG para imprimir, SVG para cartazes grandes). Coloque-o nas mesas.

As alterações aparecem no menu público imediatamente após guardar.

---

## Trabalhar localmente (opcional)

Se quiser testar no seu computador antes de publicar:

```bash
# 1. Instalar dependências
npm install

# 2. Criar o ficheiro de configuração
cp .env.local.example .env.local
#    e preencher com os valores do Supabase

# 3. Arrancar
npm run dev
```

Depois abra `http://localhost:3000` (menu) e `http://localhost:3000/admin` (backoffice).

---

## Alternativa sem GitHub (Vercel CLI)

```bash
npm install -g vercel
vercel        # segue as perguntas e faz o primeiro deploy
vercel --prod # publica em produção
```

Defina as variáveis de ambiente com `vercel env add` ou no painel do Vercel (Settings → Environment Variables), como na tabela acima.

---

## Perguntas frequentes

**Como mudo os preços ou adiciono pratos?** No backoffice (`/admin`), a qualquer momento. Não precisa de mexer no código.

**As fotos são obrigatórias?** Não. Sem foto, o produto mostra um ícone discreto. Pode adicionar fotos mais tarde.

**Posso ter mais idiomas?** A base está preparada para PT/EN. Para acrescentar (ex.: Espanhol) é preciso uma pequena alteração ao código — posso ajudar quando quiser.

**Quanto custa?** Os planos gratuitos do Supabase e do Vercel são suficientes para um bar. Só precisará de um plano pago se tiver um volume de tráfego muito elevado.

**Domínio próprio (ex.: menu.bagaustebar.pt)?** No Vercel, em **Settings → Domains**, pode ligar um domínio que tenha. Depois atualize `NEXT_PUBLIC_SITE_URL` e regenere o QR.
