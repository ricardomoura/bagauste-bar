-- =====================================================================
--  MENUS MULTI-BAR — Migração da base de dados (Supabase / PostgreSQL)
--  Correr UMA VEZ no SQL Editor do projeto Supabase existente (Bagaúste).
--  Não apaga os dados atuais: liga-os ao bar 'Bagaúste' e junta o LADO Régua.
--
--  >>> ANTES DE CORRER: na linha marcada com  <<< EDITE AQUI  coloque o
--      email com que criou o utilizador do backoffice (o dono/admin).
-- =====================================================================

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1) BARES
-- ---------------------------------------------------------------------
create table if not exists public.bars (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  subtitle      text not null default '',
  primary_color text not null default '#F15A22',
  header_mode   text not null default 'light',   -- 'light' | 'brand'
  logo_url      text,
  is_active     boolean not null default true,
  is_default    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- Bar Bagaúste (para onde vão os dados já existentes) + LADO Régua
insert into public.bars (slug, name, subtitle, primary_color, header_mode, logo_url, is_default, sort_order)
values
  ('bagauste', 'BAGAÚSTE BAR', 'Douro Valley', '#F15A22', 'brand', '/logo.jpeg', true, 1),
  ('lado-regua', 'LADO', 'Lagar D''ouro Wine Bar · Régua', '#800605', 'light', '/logo-lado-regua.jpeg', false, 2),
  ('lado-porto', 'LADO', 'Lagar D''ouro Wine Bar · Porto', '#800605', 'light', '/logo-lado-regua.jpeg', false, 3),
  ('ceira-wines-guiaes', 'Ceira Wines', 'Guiães · Douro', '#245C43', 'light', null, false, 4)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2) LIGAR CATEGORIAS E PRODUTOS A UM BAR
-- ---------------------------------------------------------------------
alter table public.categories add column if not exists bar_id uuid references public.bars(id) on delete cascade;
alter table public.products   add column if not exists bar_id uuid references public.bars(id) on delete cascade;

-- Os dados que já existem passam a pertencer ao Bagaúste
update public.categories set bar_id = (select id from public.bars where slug='bagauste') where bar_id is null;
update public.products   set bar_id = (select id from public.bars where slug='bagauste') where bar_id is null;

alter table public.categories alter column bar_id set not null;
alter table public.products   alter column bar_id set not null;
create index if not exists categories_bar_idx on public.categories(bar_id);
create index if not exists products_bar_idx on public.products(bar_id);

-- ---------------------------------------------------------------------
-- 3) UTILIZADORES: administradores e membros por bar
-- ---------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.bar_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  bar_id  uuid not null references public.bars(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, bar_id)
);

-- Funções auxiliares (SECURITY DEFINER: ignoram RLS lá dentro, sem recursão)
create or replace function public.is_app_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins a where a.user_id = auth.uid());
$$;
create or replace function public.can_manage_bar(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_app_admin()
      or exists (select 1 from public.bar_members m where m.user_id = auth.uid() and m.bar_id = b);
$$;

-- Atribuir um utilizador (por email) a um bar — só admins
create or replace function public.assign_member(p_email text, p_bar uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_app_admin() then
    raise exception 'Apenas administradores podem atribuir membros.';
  end if;
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then
    raise exception 'Não existe utilizador com o email %. Crie-o primeiro em Authentication.', p_email;
  end if;
  insert into public.bar_members(user_id, bar_id) values (uid, p_bar) on conflict do nothing;
end;
$$;
create or replace function public.remove_member(p_user uuid, p_bar uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_app_admin() then
    raise exception 'Apenas administradores podem remover membros.';
  end if;
  delete from public.bar_members where user_id = p_user and bar_id = p_bar;
end;
$$;

-- Listar membros de um bar com email (para o backoffice) — só admins
create or replace function public.bar_members_list(p_bar uuid)
returns table(user_id uuid, email text) language sql stable security definer set search_path = public as $$
  select m.user_id, u.email::text
  from public.bar_members m join auth.users u on u.id = m.user_id
  where m.bar_id = p_bar and public.is_app_admin();
$$;

grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.can_manage_bar(uuid) to authenticated;
grant execute on function public.assign_member(text, uuid) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.bar_members_list(uuid) to authenticated;

-- Definir o DONO/ADMIN inicial (o utilizador que já criou no backoffice)
insert into public.app_admins (user_id)
select id from auth.users where lower(email) = lower('ricardo.moura@gmail.com')  -- <<< EDITE AQUI
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 4) SEGURANÇA (RLS) — leitura pública de itens ativos; escrita por bar
-- ---------------------------------------------------------------------
alter table public.bars        enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.app_admins  enable row level security;
alter table public.bar_members enable row level security;

-- BARS
drop policy if exists bars_public_read on public.bars;
create policy bars_public_read on public.bars for select using (is_active = true);
drop policy if exists bars_auth_read on public.bars;
create policy bars_auth_read on public.bars for select to authenticated using (true);
drop policy if exists bars_admin_write on public.bars;
create policy bars_admin_write on public.bars for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

-- CATEGORIES
drop policy if exists categories_public_read on public.categories;
drop policy if exists categories_auth_read_all on public.categories;
drop policy if exists categories_auth_write on public.categories;
create policy categories_public_read on public.categories for select using (is_active = true);
create policy categories_auth_read on public.categories for select to authenticated using (public.can_manage_bar(bar_id));
create policy categories_auth_write on public.categories for all to authenticated using (public.can_manage_bar(bar_id)) with check (public.can_manage_bar(bar_id));

-- PRODUCTS
drop policy if exists products_public_read on public.products;
drop policy if exists products_auth_read_all on public.products;
drop policy if exists products_auth_write on public.products;
create policy products_public_read on public.products for select using (is_active = true);
create policy products_auth_read on public.products for select to authenticated using (public.can_manage_bar(bar_id));
create policy products_auth_write on public.products for all to authenticated using (public.can_manage_bar(bar_id)) with check (public.can_manage_bar(bar_id));

-- APP_ADMINS / BAR_MEMBERS (leitura própria ou admin; escrita só admin)
drop policy if exists app_admins_read on public.app_admins;
create policy app_admins_read on public.app_admins for select to authenticated using (user_id = auth.uid() or public.is_app_admin());
drop policy if exists app_admins_admin_write on public.app_admins;
create policy app_admins_admin_write on public.app_admins for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists bar_members_read on public.bar_members;
create policy bar_members_read on public.bar_members for select to authenticated using (user_id = auth.uid() or public.is_app_admin());
drop policy if exists bar_members_admin_write on public.bar_members;
create policy bar_members_admin_write on public.bar_members for all to authenticated using (public.is_app_admin()) with check (public.is_app_admin());

-- ---------------------------------------------------------------------
-- 5) DADOS DO LADO RÉGUA (novos; o Bagaúste mantém-se intacto)
-- ---------------------------------------------------------------------
-- Evita duplicar se a migração for corrida mais do que uma vez:
delete from public.products where bar_id = (select id from public.bars where slug='lado-regua');
delete from public.categories where bar_id = (select id from public.bars where slug='lado-regua');

-- Provas | Tastings
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Provas | Tastings', 'Provas | Tastings', 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Provas | Tastings' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Port Wine Flight', 'Port Wine Flight', '3 categorias de vinho do Douro · 3 copos (3×50 ml).', '3 Douro wine categories · 3 glasses (3×50 ml).', 15.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Provas | Tastings' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Iniciação ao Douro ou Porto', 'Douro or Port Initiation', '6 copos (6×50 ml).', '6 glasses (6×50 ml).', 30.00, null, 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Provas | Tastings' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Iniciação ao Douro & Porto', 'Douro & Port Initiation', '8 copos (8×50 ml). Sujeito a reserva.', '8 glasses (8×50 ml). Requires booking.', 30.00, null, 3, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Provas | Tastings' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto Vertical', 'Port Vertical', '10, 20, 30 e 40 anos.', '10, 20, 30 and 40 years.', 39.50, null, 4, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Provas | Tastings' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto Premium', 'Port Premium', '8 vinhos do Porto incríveis.', '8 incredible Port wines.', 85.50, null, 5, true);

-- Douro Branco | Douro White
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Douro Branco | Douro White', 'Douro Branco | Douro White', 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Douro Branco | Douro White' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Colheita', 'Colheita', 'Copo.', 'Glass.', 4.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Douro Branco | Douro White' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Reserva', 'Reserva', 'Copo.', 'Glass.', 5.50, null, 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Douro Branco | Douro White' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Grande Reserva', 'Grande Reserva', 'Copo.', 'Glass.', 10.00, null, 3, true);

-- Douro Tinto | Douro Red
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Douro Tinto | Douro Red', 'Douro Tinto | Douro Red', 3, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Douro Tinto | Douro Red' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Colheita', 'Colheita', 'Copo.', 'Glass.', 4.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Douro Tinto | Douro Red' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Reserva', 'Reserva', 'Copo.', 'Glass.', 6.00, null, 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Douro Tinto | Douro Red' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Grande Reserva', 'Grande Reserva', 'Copo.', 'Glass.', 11.00, null, 3, true);

-- Rosé, Espumante & Sangria | Rosé, Sparkling & Sangria
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Rosé, Espumante & Sangria | Rosé, Sparkling & Sangria', 'Rosé, Espumante & Sangria | Rosé, Sparkling & Sangria', 4, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Rosé, Espumante & Sangria | Rosé, Sparkling & Sangria' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Rosé', 'Rosé', 'Copo.', 'Glass.', 5.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Rosé, Espumante & Sangria | Rosé, Sparkling & Sangria' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Espumante', 'Sparkling', 'Copo.', 'Glass.', 6.00, null, 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Rosé, Espumante & Sangria | Rosé, Sparkling & Sangria' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Sangria Espumante', 'Sparkling Sangria', '', '', 9.50, null, 3, true);

-- Vinho Doce | Sweet Wine
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Vinho Doce | Sweet Wine', 'Vinho Doce | Sweet Wine', 5, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho Doce | Sweet Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Late Harvest', 'Late Harvest', 'Copo.', 'Glass.', 12.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho Doce | Sweet Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Moscatel', 'Moscatel', 'Copo.', 'Glass.', 4.00, null, 2, true);

-- Vinho do Porto | Port Wine
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Vinho do Porto | Port Wine', 'Vinho do Porto | Port Wine', 6, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Fine Port', 'Fine Port', 'Branco / Tawny / Ruby.', 'White / Tawny / Ruby.', 4.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto 10 Anos', '10-Year Port', 'Branco / Tawny.', 'White / Tawny.', 7.00, null, 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto 20 Anos', '20-Year Port', 'Branco / Tawny.', 'White / Tawny.', 12.00, null, 3, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto 30 Anos', '30-Year Port', 'Branco / Tawny.', 'White / Tawny.', 18.00, null, 4, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto 40 Anos', '40-Year Port', 'Branco / Tawny.', 'White / Tawny.', 25.00, null, 5, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Ruby Reserva', 'Ruby Reserva', 'Special Ruby Port.', 'Special Ruby Port.', 5.50, null, 6, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Late Bottled Vintage (LBV)', 'Late Bottled Vintage (LBV)', 'Special Ruby Port.', 'Special Ruby Port.', 7.00, null, 7, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Vintage', 'Vintage', 'Special Ruby Port.', 'Special Ruby Port.', 12.00, null, 8, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto Muito Velho 80 Anos', '80-Year Very Old Port', 'Branco (50 ml).', 'White (50 ml).', 125.00, null, 9, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Vinho do Porto | Port Wine' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto Muito Velho 100 Anos', '100-Year Very Old Port', 'Tawny (50 ml).', 'Tawny (50 ml).', 150.00, null, 10, true);

-- Cocktails de Porto | Port Cocktails
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Cocktails de Porto | Port Cocktails', 'Cocktails de Porto | Port Cocktails', 7, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Cocktails de Porto | Port Cocktails' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto Tónico', 'Port & Tonic', '', '', 7.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Cocktails de Porto | Port Cocktails' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Porto Spritz', 'Port Spritz', '', '', 12.00, null, 2, true);

-- Tábuas | Platters
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Tábuas | Platters', 'Tábuas | Platters', 8, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Tábuas | Platters' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Charcutaria', 'Charcuterie', '', '', 16.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Tábuas | Platters' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Seleção de Queijos', 'Cheese Selection', '', '', 17.00, null, 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Tábuas | Platters' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Tábua Mista', 'Mixed Platter', 'Charcutaria e queijos.', 'Charcuterie and cheese.', 23.50, null, 3, true);

-- Snacks | Snacks
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Snacks | Snacks', 'Snacks | Snacks', 9, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Snacks | Snacks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Azeitonas ou Frutos Secos', 'Olives or Dried Fruits', '', '', 1.50, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Snacks | Snacks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Azeites Virgem Extra com Pães', 'Extra-Virgin Olive Oils with Breads', '', '', 3.50, null, 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Snacks | Snacks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Paté de Sardinha & Tostas', 'Sardine Paté & Toasts', '', '', 4.00, null, 3, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Snacks | Snacks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Polvo com Molho Verde', 'Octopus with Green Sauce', '', '', 10.00, null, 4, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Snacks | Snacks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Bacalhau Fumado', 'Smoked Codfish', '', '', 10.00, null, 5, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Snacks | Snacks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), '8 Tostas com Queijo', '8 Crackers with Cheese', '', '', 10.00, null, 6, true);

-- Sobremesa | Dessert
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Sobremesa | Dessert', 'Sobremesa | Dessert', 10, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Sobremesa | Dessert' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Petit Gateau & Gelato', 'Petit Gateau & Gelato', '', '', 6.00, null, 1, true);

-- Bebidas | Soft Drinks
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Bebidas | Soft Drinks', 'Bebidas | Soft Drinks', 11, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Bebidas | Soft Drinks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Água c/ e s/ gás', 'Still & Sparkling Water', '', '', 2.00, null, 1, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Bebidas | Soft Drinks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Água Tónica', 'Tonic Water', '', '', 3.00, null, 2, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Bebidas | Soft Drinks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Sumo de Laranja', 'Orange Juice', '', '', 3.00, null, 3, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Bebidas | Soft Drinks' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Refrigerantes', 'Sodas', '', '', 3.00, null, 4, true);

-- Serviço | Service
insert into public.categories (bar_id, name_pt, name_en, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), 'Serviço | Service', 'Serviço | Service', 12, true);
insert into public.products (bar_id, category_id, name_pt, name_en, description_pt, description_en, price, image_url, sort_order, is_active) values ((select id from public.bars where slug='lado-regua'), (select id from public.categories where name_pt='Serviço | Service' and bar_id=(select id from public.bars where slug='lado-regua') limit 1), 'Taxa de Rolha', 'Cork Fee', 'Por garrafa trazida pelo cliente.', 'Per bottle brought by the guest.', 10.00, null, 1, true);

commit;

-- Fim. Verifique: select slug, (select count(*) from products p where p.bar_id=b.id) from bars b;