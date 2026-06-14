-- Fix: Add missing INSERT policy for profiles table
-- Without this, profile creation via registerCook/registerUser fails silently

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Admins can insert any profile"
  on profiles for insert
  with check (public.is_admin());
