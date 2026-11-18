-- =====================================================================
-- DOIS BRILHOS — Estrutura do banco de dados (PostgreSQL / Supabase)
-- Execute no SQL Editor do Supabase (ou via `supabase db push`).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

-- Função usada pelas políticas RLS. SECURITY DEFINER evita recursão de RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Utilitário: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Categorias e coleções
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url   text,
  sort_order  int not null default 0,
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url   text,
  sort_order  int not null default 0,
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Produtos
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 160),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text,
  description       text,
  material          text,
  category_id       uuid references public.categories(id) on delete set null,
  collection_id     uuid references public.collections(id) on delete set null,
  price             numeric(10,2) not null check (price >= 0),
  promo_price       numeric(10,2) check (promo_price is null or (promo_price >= 0 and promo_price < price)),
  stock             int not null default 0 check (stock >= 0),
  is_active         boolean not null default true,
  is_new            boolean not null default false,
  is_bestseller     boolean not null default false,
  is_featured       boolean not null default false,
  is_demo           boolean not null default false,
  view_count        int not null default 0,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_collection_idx on public.products(collection_id);
create index if not exists products_active_idx on public.products(is_active);

create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  path        text,               -- caminho no Storage (para exclusão)
  alt         text,
  sort_order  int not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id);

create table if not exists public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  label       text not null,      -- ex.: "Aro", "Comprimento", "Cor"
  value       text not null,      -- ex.: "16", "45 cm", "Dourado"
  stock       int not null default 0 check (stock >= 0),
  sort_order  int not null default 0
);
create index if not exists product_variants_product_idx on public.product_variants(product_id);

-- ---------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum (
    'pendente', 'em_atendimento', 'aguardando_pagamento', 'pago',
    'em_preparacao', 'enviado', 'entregue', 'cancelado'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  number        bigint generated always as identity unique,
  reference     text unique,          -- código enviado na mensagem do WhatsApp
  source        text not null default 'manual' check (source in ('site', 'manual')),
  status        public.order_status not null default 'pendente',
  attendant     text,
  customer_name text not null,
  customer_phone text,
  city          text,
  neighborhood  text,
  address       text,
  notes         text,
  internal_notes text,
  subtotal      numeric(10,2) not null default 0,
  shipping      numeric(10,2) not null default 0,
  discount      numeric(10,2) not null default 0,
  total         numeric(10,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_created_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,
  variant       text,
  quantity      int not null check (quantity > 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------
-- Depoimentos e configurações do site
-- ---------------------------------------------------------------------
create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  text        text not null,
  rating      int not null default 5 check (rating between 1 and 5),
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Triggers updated_at
do $$
declare t text;
begin
  foreach t in array array['categories','collections','products','orders','site_settings'] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.admin_users      enable row level security;
alter table public.categories       enable row level security;
alter table public.collections      enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.testimonials     enable row level security;
alter table public.site_settings    enable row level security;

-- admin_users: somente administradores leem. Inclusão/remoção pela Edge Function (service role).
drop policy if exists "admins read admins" on public.admin_users;
create policy "admins read admins" on public.admin_users for select to authenticated using (public.is_admin());

-- Catálogo: leitura pública do que está ativo; administradores fazem tudo.
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (is_active or public.is_admin());
drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read collections" on public.collections;
create policy "public read collections" on public.collections for select using (is_active or public.is_admin());
drop policy if exists "admin write collections" on public.collections;
create policy "admin write collections" on public.collections for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (is_active or public.is_admin());
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read product images" on public.product_images;
create policy "public read product images" on public.product_images for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.is_active)
);
drop policy if exists "admin write product images" on public.product_images;
create policy "admin write product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read product variants" on public.product_variants;
create policy "public read product variants" on public.product_variants for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.is_active)
);
drop policy if exists "admin write product variants" on public.product_variants;
create policy "admin write product variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Pedidos: somente administradores. Visitantes criam pedidos apenas pela função create_site_order.
drop policy if exists "admin all orders" on public.orders;
create policy "admin all orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin all order items" on public.order_items;
create policy "admin all order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read testimonials" on public.testimonials;
create policy "public read testimonials" on public.testimonials for select using (is_active or public.is_admin());
drop policy if exists "admin write testimonials" on public.testimonials;
create policy "admin write testimonials" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);
drop policy if exists "admin write settings" on public.site_settings;
create policy "admin write settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- FUNÇÕES PÚBLICAS (RPC)
-- =====================================================================

-- Contador de visualizações (não expõe nenhuma outra escrita).
create or replace function public.increment_product_view(p_product_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products set view_count = view_count + 1
  where id = p_product_id and is_active;
$$;
revoke all on function public.increment_product_view(uuid) from public;
grant execute on function public.increment_product_view(uuid) to anon, authenticated;

-- Registro de pedido vindo do site (status "pendente").
-- Os preços são recalculados no servidor: o cliente não consegue alterar valores.
create or replace function public.create_site_order(payload jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product record;
  v_qty int;
  v_unit numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_ref text := nullif(trim(payload->>'reference'), '');
  v_name text := trim(coalesce(payload->>'customer_name', ''));
  v_attendant text := payload->>'attendant';
begin
  if char_length(v_name) < 3 or char_length(v_name) > 120 then
    raise exception 'Nome inválido';
  end if;
  if jsonb_typeof(payload->'items') <> 'array'
     or jsonb_array_length(payload->'items') = 0
     or jsonb_array_length(payload->'items') > 50 then
    raise exception 'Itens inválidos';
  end if;
  if v_ref is not null and (v_ref !~ '^DB[0-9]{6}-[A-Z0-9]{4}$') then
    raise exception 'Referência inválida';
  end if;

  insert into public.orders (reference, source, status, attendant, customer_name, city, neighborhood, address, notes)
  values (
    v_ref, 'site', 'pendente',
    case when v_attendant ~ '^[a-z0-9_-]{1,40}$' then v_attendant else null end,
    v_name,
    left(trim(coalesce(payload->>'city', '')), 120),
    left(trim(coalesce(payload->>'neighborhood', '')), 120),
    left(trim(coalesce(payload->>'address', '')), 300),
    left(trim(coalesce(payload->>'notes', '')), 1000)
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(payload->'items') loop
    v_qty := greatest(1, least(coalesce((v_item->>'quantity')::int, 1), 99));
    select id, name, price, promo_price into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid and is_active;
    if not found then
      raise exception 'Produto indisponível';
    end if;
    v_unit := coalesce(v_product.promo_price, v_product.price);
    insert into public.order_items (order_id, product_id, product_name, variant, quantity, unit_price)
    values (v_order_id, v_product.id, v_product.name, left(v_item->>'variant', 120), v_qty, v_unit);
    v_subtotal := v_subtotal + v_unit * v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal where id = v_order_id;
  return coalesce(v_ref, v_order_id::text);
end;
$$;
revoke all on function public.create_site_order(jsonb) from public;
grant execute on function public.create_site_order(jsonb) to anon, authenticated;

-- =====================================================================
-- STORAGE — bucket de fotografias
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 8388608, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Bucket público: as imagens são servidas pela URL pública sem precisar de
-- política SELECT. Não criamos SELECT para anon, assim ninguém consegue LISTAR
-- os arquivos do bucket. Administradores podem listar (necessário p/ gerenciar).
drop policy if exists "public read product-images" on storage.objects;
drop policy if exists "admin read product-images" on storage.objects;
create policy "admin read product-images" on storage.objects for select to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin insert product-images" on storage.objects;
create policy "admin insert product-images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin update product-images" on storage.objects;
create policy "admin update product-images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "admin delete product-images" on storage.objects;
create policy "admin delete product-images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
