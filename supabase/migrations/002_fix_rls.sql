-- Fix RLS policies to avoid recursion
-- Run this in SQL Editor

drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Admins can update any profile" on profiles;
drop policy if exists "Admins can delete non-admin profiles" on profiles;
drop policy if exists "Users can view own orders" on orders;
drop policy if exists "Staff can view all orders" on orders;
drop policy if exists "Anyone can insert orders" on orders;
drop policy if exists "Users can update own orders" on orders;
drop policy if exists "Staff can update any order" on orders;
drop policy if exists "Anyone can view active payment methods" on payment_methods;
drop policy if exists "Admins can view all payment methods" on payment_methods;
drop policy if exists "Admins can insert payment methods" on payment_methods;
drop policy if exists "Admins can update payment methods" on payment_methods;
drop policy if exists "Admins can delete payment methods" on payment_methods;

-- Security definer helpers (avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'cook')
  );
$$;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update
  using (public.is_admin());

create policy "Admins can delete non-admin profiles"
  on profiles for delete
  using (public.is_admin() and role != 'admin');

-- Orders policies
create policy "Users can view own orders"
  on orders for select
  using (user_id = auth.uid() or public.is_staff());

create policy "Anyone can insert orders"
  on orders for insert
  with check (true);

create policy "Users can update own orders"
  on orders for update
  using (user_id = auth.uid());

create policy "Staff can update any order"
  on orders for update
  using (public.is_staff());

-- Payment methods policies
create policy "Anyone can view active payment methods"
  on payment_methods for select
  using (is_active = true or public.is_admin());

create policy "Admins can insert payment methods"
  on payment_methods for insert
  with check (public.is_admin());

create policy "Admins can update payment methods"
  on payment_methods for update
  using (public.is_admin());

create policy "Admins can delete payment methods"
  on payment_methods for delete
  using (public.is_admin());
