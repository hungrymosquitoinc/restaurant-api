-- Sales report snapshots table
create table sales_reports (
  id bigserial primary key,
  period_date date not null,
  period_type text not null check (period_type in ('daily', 'monthly', 'quarterly', 'yearly')),
  label text not null,
  total_revenue numeric(12,2) not null default 0,
  total_orders integer not null default 0,
  avg_order_value numeric(10,2) not null default 0,
  dine_in_count integer not null default 0,
  takeout_count integer not null default 0,
  guest_orders integer not null default 0,
  popular_items jsonb default '[]',
  revenue_by_category jsonb default '[]',
  payment_methods jsonb default '[]',
  daily_breakdown jsonb default '[]',
  order_details jsonb default '[]',
  created_at timestamptz default now()
);

alter table sales_reports enable row level security;

create policy "Admins can view all sales reports"
  on sales_reports for select
  using (public.is_admin());

create policy "Admins can insert sales reports"
  on sales_reports for insert
  with check (public.is_admin());

create policy "Admins can delete sales reports"
  on sales_reports for delete
  using (public.is_admin());
