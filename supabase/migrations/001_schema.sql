-- Restaurant App Schema
-- Run this in Supabase SQL Editor after creating a project

-- 1. Profiles (extends Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'cook', 'user')),
  phone text default '',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 2. Orders
create table orders (
  id bigserial primary key,
  display_id text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  guest_name text default '',
  guest_phone text default '',
  items jsonb not null default '[]',
  total numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  status_history jsonb not null default '[]',
  order_type text not null default 'dine-in' check (order_type in ('dine-in', 'takeout')),
  delivery jsonb default '{}',
  payment jsonb default '{}',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Payment methods (admin-configured)
create table payment_methods (
  id bigserial primary key,
  type text not null check (type in ('bank', 'fintech', 'crypto')),
  name text not null,
  account_name text default '',
  account_number text default '',
  custom_name text default '',
  network text default '',
  memo_tag text default '',
  qr_image text default '',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table orders enable row level security;
alter table payment_methods enable row level security;

-- Profiles: users can read/update own profile; admins can read/update all
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete non-admin profiles"
  on profiles for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and role != 'admin'
  );

-- Orders: users see own; admins/cooks see all; anyone can insert
create policy "Users can view own orders"
  on orders for select
  using (user_id = auth.uid());

create policy "Staff can view all orders"
  on orders for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'cook'))
  );

create policy "Anyone can insert orders"
  on orders for insert
  with check (true);

create policy "Users can update own orders"
  on orders for update
  using (user_id = auth.uid());

create policy "Staff can update any order"
  on orders for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'cook'))
  );

-- Payment methods: admins manage; everyone can read active ones
create policy "Anyone can view active payment methods"
  on payment_methods for select
  using (is_active = true);

create policy "Admins can view all payment methods"
  on payment_methods for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert payment methods"
  on payment_methods for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update payment methods"
  on payment_methods for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete payment methods"
  on payment_methods for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed initial admin user (run AFTER creating user in Auth UI)
-- 1. Create user in Supabase Auth dashboard:
--    admin@test.com / admin123
--    user@test.com / password
--    cook@test.com / cookpass
-- 2. Run this SQL to create their profiles:
-- insert into profiles (id, name, role, phone, is_active)
-- values
--   ('<admin-user-uuid>', 'Admin User', 'admin', '555-0001', true),
--   ('<user-1-uuid>', 'John Doe', 'user', '555-0101', true),
--   ('<user-2-uuid>', 'Jane Smith', 'user', '555-0102', true),
--   ('<cook-uuid>', 'Chef Marco', 'cook', '555-0201', true);
