-- =====================================================================
-- Security Hardening Migration
--
-- Fixes & protections applied:
--   1. Separates sensitive farmer KYC / PII (NIN, home address, farmland
--      address, structured address_parts, document_url, verification_notes,
--      farm_size, crop_produces, state_of_origin) out of public.farms into
--      public.farm_kyc, readable ONLY by the farm owner and admins.
--   2. Locks public.farms SELECT to owner/admin and exposes a safe public
--      RPC get_verified_farms() returning only (id, name, location, status,
--      created_at) for verified farms (zero owner_id / zero PII).
--   3. Fixes handle_new_user() so public signups (raw_user_meta_data) can
--      NEVER register as 'admin' — only raw_app_meta_data or SQL-Editor
--      make_admin() / set_user_role() can grant admin privileges.
--   4. Revokes make_admin() / set_user_role() from authenticated clients.
--   5. Tightens orders visibility (farmers never see unpaid Awaiting payment
--      or failed orders), reviews update policy (active accounts only),
--      column-level grants on pools.created_by and reviews.customer_id,
--      FORCE ROW LEVEL SECURITY across all tables, and least-privilege grants.
-- =====================================================================

-- ---------------------- 1. Private helper schema ----------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated;

-- Checks whether a farm is verified without exposing public.farms rows to
-- anonymous or customer SELECT queries.
create or replace function private.is_farm_verified(p_farm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.farms f
    where f.id = p_farm_id
      and f.status = 'verified'
  );
$$;

revoke all on function private.is_farm_verified(uuid) from public;
grant execute on function private.is_farm_verified(uuid) to anon, authenticated, service_role;

create or replace function private.is_payment_settled(p_payment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_payment_id is not null and exists (
    select 1
    from public.payments p
    where p.id = p_payment_id
      and p.status = 'success'
  );
$$;

revoke all on function private.is_payment_settled(uuid) from public;
grant execute on function private.is_payment_settled(uuid) to authenticated, service_role;

-- -------------- 2. Farmer KYC / PII isolation (farm_kyc) --------------
create table if not exists public.farm_kyc (
  farm_id             uuid primary key references public.farms (id) on delete cascade,
  nin                 text not null default '' check (char_length(nin) <= 20),
  residential_address text not null default '' check (char_length(residential_address) <= 300),
  farm_address        text not null default '' check (char_length(farm_address) <= 300),
  address_parts       jsonb not null default '{}'::jsonb,
  farm_size           text not null default '' check (char_length(farm_size) <= 100),
  crop_produces       text not null default '' check (char_length(crop_produces) <= 300),
  state_of_origin     text not null default '' check (char_length(state_of_origin) <= 60),
  document_url        text not null default '' check (char_length(document_url) <= 500),
  verification_notes  text not null default '' check (char_length(verification_notes) <= 1000),
  updated_at          timestamptz not null default now()
);

-- Ensure input-hardening constraints exist on farm_kyc even if earlier
-- optional migrations were skipped.
create or replace function public.is_safe_link(value text)
returns boolean
language sql immutable parallel safe set search_path = ''
as $$
  select value is not null and char_length(value) <= 500 and (
    value = ''
    or value ~ '^/images/[A-Za-z0-9._-]+$'
    or value ~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?(/[^\s"''<>`\\]*)?$'
    or value ~ '^[0-9]{10,13}-[0-9a-f]{12}$'
  );
$$;

create or replace function public.is_plain_text(value text)
returns boolean
language sql immutable parallel safe set search_path = ''
as $$
  select value is null or value !~* '<\s*/?\s*(script|iframe|object|embed|svg|img|style|link|meta|form)\y';
$$;

alter table public.farm_kyc drop constraint if exists farm_kyc_nin_digits;
alter table public.farm_kyc add constraint farm_kyc_nin_digits
  check (nin = '' or nin ~ '^[0-9]{11}$') not valid;

alter table public.farm_kyc drop constraint if exists farm_kyc_document_safe;
alter table public.farm_kyc add constraint farm_kyc_document_safe
  check (public.is_safe_link(document_url)) not valid;

alter table public.farm_kyc drop constraint if exists farm_kyc_text_plain;
alter table public.farm_kyc add constraint farm_kyc_text_plain
  check (
    public.is_plain_text(residential_address)
    and public.is_plain_text(farm_address)
    and public.is_plain_text(farm_size)
    and public.is_plain_text(crop_produces)
    and public.is_plain_text(state_of_origin)
    and public.is_plain_text(verification_notes)
  ) not valid;

alter table public.farm_kyc drop constraint if exists farm_kyc_address_parts_shape;
alter table public.farm_kyc add constraint farm_kyc_address_parts_shape
  check (
    jsonb_typeof(address_parts) = 'object'
    and pg_column_size(address_parts) <= 2048
    and public.is_plain_text(address_parts::text)
  ) not valid;

-- Migrate existing KYC columns from public.farms (handles databases with or
-- without the optional 20261125000200_farm_kyc_addresses.sql migration)
-- and then drop those sensitive columns from public.farms.
do $$
declare
  v_has_nin boolean;
  v_has_farm_addr boolean;
  v_has_addr_parts boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'farms' and column_name = 'nin'
  ) into v_has_nin;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'farms' and column_name = 'farm_address'
  ) into v_has_farm_addr;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'farms' and column_name = 'address_parts'
  ) into v_has_addr_parts;

  if v_has_nin then
    execute format(
      $sql$
        insert into public.farm_kyc (
          farm_id, nin, residential_address, farm_address, address_parts,
          farm_size, crop_produces, state_of_origin, document_url, verification_notes
        )
        select
          id,
          coalesce(nin, ''),
          coalesce(residential_address, ''),
          %s,
          %s,
          coalesce(farm_size, ''),
          coalesce(crop_produces, ''),
          coalesce(state_of_origin, ''),
          coalesce(document_url, ''),
          coalesce(verification_notes, '')
        from public.farms
        on conflict (farm_id) do update set
          nin = case when excluded.nin <> '' then excluded.nin else public.farm_kyc.nin end,
          residential_address = case when excluded.residential_address <> '' then excluded.residential_address else public.farm_kyc.residential_address end,
          farm_address = case when excluded.farm_address <> '' then excluded.farm_address else public.farm_kyc.farm_address end,
          address_parts = case when excluded.address_parts <> '{}'::jsonb then excluded.address_parts else public.farm_kyc.address_parts end,
          farm_size = case when excluded.farm_size <> '' then excluded.farm_size else public.farm_kyc.farm_size end,
          crop_produces = case when excluded.crop_produces <> '' then excluded.crop_produces else public.farm_kyc.crop_produces end,
          state_of_origin = case when excluded.state_of_origin <> '' then excluded.state_of_origin else public.farm_kyc.state_of_origin end,
          document_url = case when excluded.document_url <> '' then excluded.document_url else public.farm_kyc.document_url end,
          verification_notes = case when excluded.verification_notes <> '' then excluded.verification_notes else public.farm_kyc.verification_notes end
      $sql$,
      case when v_has_farm_addr then $q$coalesce(farm_address, '')$q$ else $q$''$q$ end,
      case when v_has_addr_parts then $q$coalesce(address_parts, '{}'::jsonb)$q$ else $q$'{}'::jsonb$q$ end
    );
  else
    insert into public.farm_kyc (farm_id)
    select id from public.farms
    on conflict (farm_id) do nothing;
  end if;
end $$;

alter table public.farms
  drop column if exists nin,
  drop column if exists residential_address,
  drop column if exists farm_address,
  drop column if exists address_parts,
  drop column if exists farm_size,
  drop column if exists crop_produces,
  drop column if exists state_of_origin,
  drop column if exists document_url,
  drop column if exists verification_notes;

-- Automatically create a farm_kyc row for every new farm.
create or replace function public.ensure_farm_kyc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.farm_kyc (farm_id)
  values (new.id)
  on conflict (farm_id) do nothing;
  return new;
end;
$$;

drop trigger if exists ensure_farm_kyc on public.farms;
create trigger ensure_farm_kyc
  after insert on public.farms
  for each row execute function public.ensure_farm_kyc();

-- Lock admin-only fields on farm_kyc and require re-vetting when a farmer
-- resubmits after rejection or edits core KYC fields post-verification.
create or replace function public.protect_farm_kyc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jwt_role text := nullif(current_setting('request.jwt.claim.role', true), '');
  v_is_privileged boolean := (v_jwt_role = 'service_role') or ((select auth.uid()) is null and v_jwt_role is null) or public.is_admin();
begin
  new.updated_at := now();

  if not v_is_privileged then
    if tg_op = 'INSERT' then
      new.verification_notes := '';
    else
      new.farm_id := old.farm_id;
      new.verification_notes := old.verification_notes;

      if (
        new.nin is distinct from old.nin
        or new.residential_address is distinct from old.residential_address
        or new.farm_address is distinct from old.farm_address
        or new.address_parts is distinct from old.address_parts
        or new.farm_size is distinct from old.farm_size
        or new.crop_produces is distinct from old.crop_produces
        or new.document_url is distinct from old.document_url
      ) then
        update public.farms
        set status = 'pending'
        where id = new.farm_id
          and status in ('rejected', 'verified');
      else
        update public.farms
        set status = 'pending'
        where id = new.farm_id
          and status = 'rejected';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_farm_kyc on public.farm_kyc;
create trigger protect_farm_kyc
  before insert or update on public.farm_kyc
  for each row execute function public.protect_farm_kyc();

-- Tighten protect_farm(): non-admins cannot alter status/owner_id, and even
-- admins cannot mark an owned farm 'verified' without a complete KYC dossier.
create or replace function public.protect_farm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jwt_role text := nullif(current_setting('request.jwt.claim.role', true), '');
  v_is_privileged boolean := (v_jwt_role = 'service_role') or ((select auth.uid()) is null and v_jwt_role is null) or public.is_admin();
  v_kyc public.farm_kyc;
begin
  if not v_is_privileged then
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.status := old.status;
    new.created_at := old.created_at;
  elsif new.status = 'verified' and old.status is distinct from 'verified' and new.owner_id is not null then
    select * into v_kyc from public.farm_kyc where farm_id = new.id;
    if not found
       or v_kyc.nin !~ '^[0-9]{11}$'
       or char_length(trim(v_kyc.residential_address)) < 5
       or char_length(trim(new.location)) < 3
       or char_length(trim(v_kyc.farm_size)) < 2
       or char_length(trim(v_kyc.crop_produces)) < 2 then
      raise exception 'Cannot verify farm: 11-digit NIN and complete verification dossier are compulsory.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_farm on public.farms;
create trigger protect_farm
  before update on public.farms
  for each row execute function public.protect_farm();

-- Safe public read RPC for verified farms (no owner_id, no KYC/PII).
create or replace function public.get_verified_farms()
returns table (
  id         uuid,
  name       text,
  location   text,
  status     text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.name, f.location, f.status, f.created_at
  from public.farms f
  where f.status = 'verified'
  order by f.created_at;
$$;

revoke all on function public.get_verified_farms() from public;
grant execute on function public.get_verified_farms() to anon, authenticated, service_role;

-- -------------- 3. Fix admin signup privilege escalation --------------
-- Public signups (raw_user_meta_data) can ONLY register as 'customer' or
-- 'farmer'. Only raw_app_meta_data (service_role / Admin API) or SQL-Editor
-- make_admin() / set_user_role() can grant 'admin'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app_role text := nullif(trim(new.raw_app_meta_data ->> 'role'), '');
  v_user_role text := nullif(trim(new.raw_user_meta_data ->> 'role'), '');
  v_role text;
  v_full_name text;
  v_farm_name text;
  v_farm_location text;
begin
  if v_app_role in ('customer', 'farmer', 'admin') then
    v_role := v_app_role;
  elsif v_user_role in ('customer', 'farmer') then
    v_role := v_user_role;
  else
    v_role := 'customer';
  end if;

  v_full_name := left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_app_meta_data ->> 'full_name', ''), '[<>]', '', 'g'), 120);
  v_farm_name := left(regexp_replace(coalesce(nullif(trim(new.raw_user_meta_data ->> 'farm_name'), ''), 'My Farm'), '[<>]', '', 'g'), 120);
  v_farm_location := left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'farm_location', ''), '[<>]', '', 'g'), 160);

  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    v_role,
    v_full_name,
    left(coalesce(new.email, ''), 320)
  )
  on conflict (id) do update set
    role = case
      when v_app_role = 'admin' then 'admin'
      else public.profiles.role
    end,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    email = case when excluded.email <> '' then excluded.email else public.profiles.email end;

  if v_role = 'farmer' then
    insert into public.farms (owner_id, name, location)
    values (
      new.id,
      case when char_length(trim(v_farm_name)) >= 2 then trim(v_farm_name) else 'My Farm' end,
      v_farm_location
    )
    on conflict (owner_id) do nothing;
  end if;

  return new;
end;
$$;

-- Lock down admin-promotion helpers: SQL Editor / service_role only.
create or replace function public.make_admin(p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_jwt_role text := nullif(current_setting('request.jwt.claim.role', true), '');
begin
  if (v_jwt_role is distinct from 'service_role')
     and ((select auth.uid()) is not null or v_jwt_role is not null)
     and not public.is_admin() then
    raise exception 'Only administrators can promote accounts.';
  end if;

  select id into v_uid from auth.users where lower(trim(email)) = lower(trim(p_email));
  if v_uid is null then
    raise exception 'No user found with email "%" in auth.users. Create the account in Supabase Auth first.', p_email;
  end if;

  update public.profiles
  set role = 'admin', status = 'active'
  where id = v_uid;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  where id = v_uid;

  return 'User ' || p_email || ' (ID: ' || v_uid || ') is now an active FarmDirect Administrator.';
end;
$$;

create or replace function public.set_user_role(p_email text, p_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_jwt_role text := nullif(current_setting('request.jwt.claim.role', true), '');
begin
  if p_role not in ('customer', 'farmer', 'admin') then
    raise exception 'Invalid role "%". Allowed: customer, farmer, admin.', p_role;
  end if;

  if (v_jwt_role is distinct from 'service_role')
     and ((select auth.uid()) is not null or v_jwt_role is not null)
     and not public.is_admin() then
    raise exception 'Only administrators can change account roles.';
  end if;

  select id into v_uid from auth.users where lower(trim(email)) = lower(trim(p_email));
  if v_uid is null then
    raise exception 'No user found with email "%" in auth.users.', p_email;
  end if;

  update public.profiles
  set role = p_role
  where id = v_uid;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p_role)
  where id = v_uid;

  return 'User ' || p_email || ' role updated to ' || p_role;
end;
$$;

revoke execute on function public.make_admin(text) from public, anon, authenticated;
grant execute on function public.make_admin(text) to service_role;

revoke execute on function public.set_user_role(text, text) from public, anon, authenticated;
grant execute on function public.set_user_role(text, text) to service_role;

revoke execute on function public.ensure_farm_kyc() from public, anon, authenticated;
revoke execute on function public.protect_farm_kyc() from public, anon, authenticated;

-- Also cancel unpaid orders when confirm_payment rejects an amount mismatch.
create or replace function public.confirm_payment(p_reference text, p_amount_kobo bigint)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where reference = p_reference for update;
  if not found then
    raise exception 'Unknown payment reference.';
  end if;
  if v_payment.status = 'success' then
    return 'already_confirmed';
  end if;
  if p_amount_kobo <> v_payment.amount::bigint * 100 then
    update public.payments set status = 'failed' where id = v_payment.id;
    update public.orders set status = 'Cancelled'
    where payment_id = v_payment.id and status = 'Awaiting payment';
    return 'amount_mismatch';
  end if;

  update public.payments set status = 'success', paid_at = now() where id = v_payment.id;

  update public.orders set status = 'Placed'
  where payment_id = v_payment.id and status = 'Awaiting payment';

  update public.products p
  set quantity = greatest(0, p.quantity - s.deducted)
  from (
    select oi.product_id, sum(oi.qty)::integer as deducted
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.payment_id = v_payment.id and oi.product_id is not null
    group by oi.product_id
  ) s
  where p.id = s.product_id;

  update public.pools p
  set raised = p.raised + s.amount, members = p.members + s.shares
  from (
    select oi.pool_id, sum(oi.unit_price * oi.qty)::integer as amount, count(*)::integer as shares
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.payment_id = v_payment.id and oi.pool_id is not null
    group by oi.pool_id
  ) s
  where p.id = s.pool_id;

  update public.pools set status = 'funded'
  where status = 'open' and raised >= target;

  return 'confirmed';
end;
$$;

-- -------------- 4. Harden RLS Policies Across All Tables --------------
alter table public.profiles    enable row level security;
alter table public.farms       enable row level security;
alter table public.farm_kyc    enable row level security;
alter table public.products    enable row level security;
alter table public.pools       enable row level security;
alter table public.payments    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews     enable row level security;
alter table public.rate_limits enable row level security;

alter table public.profiles    force row level security;
alter table public.farms       force row level security;
alter table public.farm_kyc    force row level security;
alter table public.products    force row level security;
alter table public.pools       force row level security;
alter table public.payments    force row level security;
alter table public.orders      force row level security;
alter table public.order_items force row level security;
alter table public.reviews     force row level security;
alter table public.rate_limits force row level security;

-- farms: ONLY owner and admin can read public.farms directly.
drop policy if exists "farms: read verified, own or admin" on public.farms;
drop policy if exists "farms: read own or admin" on public.farms;
create policy "farms: read own or admin" on public.farms
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());

-- farm_kyc: ONLY farm owner and admin can read/write KYC records.
drop policy if exists "farm_kyc: read own or admin" on public.farm_kyc;
create policy "farm_kyc: read own or admin" on public.farm_kyc
  for select to authenticated
  using (
    exists (
      select 1 from public.farms f
      where f.id = farm_id and f.owner_id = (select auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "farm_kyc: insert own or admin" on public.farm_kyc;
create policy "farm_kyc: insert own or admin" on public.farm_kyc
  for insert to authenticated
  with check (
    exists (
      select 1 from public.farms f
      where f.id = farm_id and f.owner_id = (select auth.uid())
    )
    or public.is_admin()
  );

drop policy if exists "farm_kyc: update own or admin" on public.farm_kyc;
create policy "farm_kyc: update own or admin" on public.farm_kyc
  for update to authenticated
  using (
    exists (
      select 1 from public.farms f
      where f.id = farm_id and f.owner_id = (select auth.uid())
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.farms f
      where f.id = farm_id and f.owner_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- products: shoppers read live listings from verified farms via private helper.
drop policy if exists "products: read live, own or admin" on public.products;
create policy "products: read live, own or admin" on public.products
  for select to anon, authenticated
  using (
    public.is_admin()
    or farm_id = public.my_farm_id()
    or (status = 'live' and (select private.is_farm_verified(farm_id)))
  );

-- orders: farmers only see paid orders for their farm (not unpaid Awaiting payment).
drop policy if exists "orders: read own, own farm or admin" on public.orders;
create policy "orders: read own, own farm or admin" on public.orders
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or (
      farm_id = public.my_farm_id()
      and (
        status in ('Placed', 'Confirmed', 'Dispatched', 'Delivered')
        or (status = 'Cancelled' and (select private.is_payment_settled(payment_id)))
      )
    )
    or public.is_admin()
  );

-- reviews: suspended accounts cannot edit existing reviews either.
drop policy if exists "reviews: update own" on public.reviews;
create policy "reviews: update own" on public.reviews
  for update to authenticated
  using (
    customer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.status = 'active'
    )
  )
  with check (
    customer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.status = 'active'
    )
  );

-- -------------- 5. Least-privilege table & column grants --------------
revoke all on public.profiles    from public, anon, authenticated;
revoke all on public.farms       from public, anon, authenticated;
revoke all on public.farm_kyc    from public, anon, authenticated;
revoke all on public.products    from public, anon, authenticated;
revoke all on public.pools       from public, anon, authenticated;
revoke all on public.payments    from public, anon, authenticated;
revoke all on public.orders      from public, anon, authenticated;
revoke all on public.order_items from public, anon, authenticated;
revoke all on public.reviews     from public, anon, authenticated;
revoke all on public.rate_limits from public, anon, authenticated;

-- Anon can ONLY read public catalogue/pool/review columns (no owner/creator UUIDs).
grant select on public.products to anon;
grant select (id, product_id, name, target, raised, members, closes_at, status, created_at) on public.pools to anon;
grant select (id, product_id, author_name, rating, comment, created_at) on public.reviews to anon;

-- Authenticated least-privilege grants (still gated by RLS & triggers).
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.farms to authenticated;
grant select, insert, update on public.farm_kyc to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select (id, product_id, name, target, raised, members, closes_at, status, created_at), insert, update, delete on public.pools to authenticated;
grant select on public.payments to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;

-- Service role retains full access for Edge Functions & admin tasks.
grant all on public.profiles, public.farms, public.farm_kyc, public.products,
  public.pools, public.payments, public.orders, public.order_items,
  public.reviews, public.rate_limits to service_role;

-- -------------- 6. Helpful RLS / query indexes --------------
create index if not exists idx_farms_owner_id on public.farms (owner_id);
create index if not exists idx_farms_status on public.farms (status);
create index if not exists idx_pools_status on public.pools (status);
create index if not exists idx_orders_status on public.orders (status);

-- Keep Realtime publication updated for farm_kyc if publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'farm_kyc'
     ) then
    alter publication supabase_realtime add table public.farm_kyc;
  end if;
end $$;
