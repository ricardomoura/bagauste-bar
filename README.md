# Bagaúste Bar — Menu Digital

Aplicação web do menu digital do **Bagaúste Bar** (Vale do Douro): menu público bilingue (PT/EN), backoffice de gestão e QR Code.

👉 **Para instalar e publicar, siga o `GUIA-DE-INSTALACAO.md`.**

## Stack
- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — PostgreSQL, Auth e Storage
- [qrcode](https://www.npmjs.com/package/qrcode) — geração do QR Code

## Estrutura
```
app/
  page.tsx              → Menu público (Server Component)
  admin/
    layout.tsx          → Proteção de sessão + navegação do backoffice
    page.tsx            → Gestão de categorias e produtos
    login/page.tsx      → Início de sessão
    qr/page.tsx         → Geração e download do QR Code
components/
  MenuView.tsx          → Interface do menu público (PT/EN)
  admin/                → Dashboard e formulários (categorias, produtos)
lib/
  supabase/             → Clientes Supabase (browser / server)
  types.ts              → Tipos de dados
supabase/
  schema.sql            → Esquema da base de dados + segurança (RLS)
```

## Variáveis de ambiente
Ver `.env.local.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Desenvolvimento
```bash
npm install
cp .env.local.example .env.local   # preencher
npm run dev
```

## Segurança
O acesso aos dados é controlado por **Row Level Security** no Supabase: os visitantes só conseguem **ler** itens ativos; **criar/editar/eliminar** exige sessão autenticada. A `anon key` é pública por design — a proteção está nas políticas RLS definidas em `supabase/schema.sql`.
