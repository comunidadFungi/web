-- ============================================================
-- Comunidad Fungi — Supabase Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Blog posts
create table if not exists blog_posts (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  slug       text unique not null,
  excerpt    text,
  content    text,
  cover_image text,
  category   text default 'General',
  published  boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pedidos / Órdenes
create table if not exists orders (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid references auth.users(id) on delete set null,
  user_email         text,
  items              jsonb not null default '[]',
  total              integer not null default 0,
  status             text not null default 'pending'
                       check (status in ('pending','processing','completed','cancelled')),
  external_reference text unique,
  mp_payment_id      text,
  notes              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Agregar columnas si la tabla ya existe (migraciones)
alter table orders add column if not exists external_reference text unique;
alter table orders add column if not exists mp_payment_id text;

-- Documentos de usuario
create table if not exists user_documents (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id) on delete cascade unique,
  ci_url           text,
  prescription_url text,
  certificate_url  text,
  verified         boolean default false,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- RLS: blog_posts — lectura pública de publicados, escritura solo autenticados
alter table blog_posts enable row level security;
drop policy if exists "Public read published" on blog_posts;
drop policy if exists "Auth full access" on blog_posts;
create policy "Public read published" on blog_posts
  for select using (published = true);
create policy "Auth full access" on blog_posts
  for all using (auth.role() = 'authenticated');

-- RLS: orders — cada usuario ve sus propios pedidos, admin ve todos
alter table orders enable row level security;
drop policy if exists "User sees own orders" on orders;
drop policy if exists "Auth full access orders" on orders;
create policy "User sees own orders" on orders
  for select using (auth.uid() = user_id);
create policy "Auth full access orders" on orders
  for all using (auth.role() = 'authenticated');

-- RLS: user_documents — cada usuario gestiona los suyos
alter table user_documents enable row level security;
drop policy if exists "User manages own docs" on user_documents;
drop policy if exists "Auth full access docs" on user_documents;
create policy "User manages own docs" on user_documents
  for all using (auth.uid() = user_id);
create policy "Auth full access docs" on user_documents
  for all using (auth.role() = 'authenticated');
