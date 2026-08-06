-- =====================================================================
--  BAGAÚSTE BAR — Menu digital
--  Esquema da base de dados (Supabase / PostgreSQL)
--  Execute este ficheiro no painel do Supabase: SQL Editor -> New query -> Run
-- =====================================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- CATEGORIAS
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name_pt     text not null,
  name_en     text not null default '',
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PRODUTOS
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.categories(id) on delete cascade,
  name_pt       text not null,
  name_en       text not null default '',
  description_pt text not null default '',
  description_en text not null default '',
  price         numeric(10,2) not null default 0,
  image_url     text,
  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);

-- ---------------------------------------------------------------------
-- SEGURANÇA (Row Level Security)
--   • Qualquer visitante (anon) pode LER itens ativos  -> menu público
--   • Só utilizadores autenticados podem ESCREVER       -> backoffice
-- ---------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products   enable row level security;

-- Leitura pública apenas de itens ativos
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  using (is_active = true);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  using (is_active = true);

-- Utilizadores autenticados leem tudo (incluindo inativos, no backoffice)
drop policy if exists "categories_auth_read_all" on public.categories;
create policy "categories_auth_read_all"
  on public.categories for select
  to authenticated
  using (true);

drop policy if exists "products_auth_read_all" on public.products;
create policy "products_auth_read_all"
  on public.products for select
  to authenticated
  using (true);

-- Escrita (insert/update/delete) só para autenticados
drop policy if exists "categories_auth_write" on public.categories;
create policy "categories_auth_write"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "products_auth_write" on public.products;
create policy "products_auth_write"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------
-- STORAGE — bucket público para as fotos dos produtos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('menu', 'menu', true)
on conflict (id) do nothing;

-- Leitura pública das imagens
drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read"
  on storage.objects for select
  using (bucket_id = 'menu');

-- Upload / atualização / remoção só para autenticados
drop policy if exists "menu_images_auth_write" on storage.objects;
create policy "menu_images_auth_write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'menu')
  with check (bucket_id = 'menu');

-- ---------------------------------------------------------------------
-- DADOS DE EXEMPLO (opcional — pode apagar depois)
-- ---------------------------------------------------------------------
insert into public.categories (name_pt, name_en, sort_order) values
  ('Vinhos do Douro', 'Douro Wines', 1),
  ('Cervejas', 'Beers', 2),
  ('Petiscos', 'Snacks', 3),
  ('Sobremesas', 'Desserts', 4)
on conflict do nothing;
