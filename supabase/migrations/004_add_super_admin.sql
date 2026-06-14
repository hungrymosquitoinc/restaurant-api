-- Add super_admin flag to profiles
alter table profiles add column if not exists is_super_admin boolean default false;

-- Mark the original admin as super admin
update profiles set is_super_admin = true where email = 'admin@a.com';

-- Helper: check if current user is super admin
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_super_admin = true
  );
$$;

-- Super admins see all; regular admins see everyone except super admins
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (
    auth.uid() = id
    or public.is_super_admin()
    or (public.is_admin() and not public.is_super_admin() and not is_super_admin)
  );

-- Super admins can delete any non-super-admin; regular admins can delete users/cooks only
drop policy if exists "Admins can delete non-admin profiles" on profiles;
create policy "Admins can delete non-admin profiles"
  on profiles for delete
  using (
    public.is_super_admin() and not is_super_admin
    or (public.is_admin() and not public.is_super_admin() and role not in ('admin', 'super_admin'))
  );
