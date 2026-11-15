-- =====================================================================
-- FarmDirect database: tables, row level security (RLS) and the
-- server-side rules that keep the marketplace safe.
--
-- Security model in one paragraph:
--   * Every table has RLS switched on. With no matching policy, a request
--     is refused, so anything not explicitly allowed below is denied.
--   * The browser only ever holds the public "anon" key. Orders, payments
--     and pool totals are written ONLY by edge functions that use the
--     service-role key, which never leaves Supabase.
--   * Things a user must not change about themselves (role, account
--     status, a farm's verification, a listing's approval) are locked by
--     triggers, so even a hand-crafted API request cannot change them.
-- =====================================================================

-- ------------------------------ Tables ------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'customer' check (role in ('customer', 'farmer', 'admin')),
  full_name   text not null default '' check (char_length(full_name) <= 120),
  email       text not null default '' check (char_length(email) <= 320),
  phone       text not null default '' check (char_length(phone) <= 30),
  address     text not null default '' check (char_length(address) <= 300),
  status      text not null default 'active' check (status in ('active', 'suspended')),
  created_at  timestamptz not null default now()
);

create table public.farms (
  id          uuid primary key default gen_random_uuid(),
  -- null for sample farms that have no login
  owner_id    uuid unique references public.profiles (id) on delete set null,
  name        text not null check (char_length(name) between 2 and 120),
  location    text not null default '' check (char_length(location) <= 160),
  status      text not null default 'pending' check (status in ('pending', 'verified', 'suspended')),
  created_at  timestamptz not null default now()
);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references public.farms (id) on delete cascade,
  kind        text not null default 'crop' check (kind in ('crop', 'livestock')),
  name        text not null check (char_length(name) between 2 and 120),
  category    text not null check (category in ('Vegetables', 'Fruits', 'Tubers', 'Grains', 'Cow', 'Goat', 'Ram')),
  -- whole naira; for livestock this is the price of the entire animal
  price       integer not null check (price > 0 and price <= 100000000),
  unit        text not null default 'kg' check (char_length(unit) <= 20),
  description text not null default '' check (char_length(description) <= 2000),
  image       text not null default '' check (char_length(image) <= 500),
  gallery     text[] not null default '{}',
  tags        text[] not null default '{}',
  highlights  text[] not null default '{}',
  -- livestock only
  weight      text not null default '' check (char_length(weight) <= 40),
  yield_kg    numeric not null default 0 check (yield_kg >= 0),
  min_share   integer not null default 0 check (min_share >= 0),
  status      text not null default 'pending' check (status in ('pending', 'live', 'paused', 'rejected')),
  created_at  timestamptz not null default now()
);

create table public.pools (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 120),
  created_by  uuid references public.profiles (id) on delete set null,
  target      integer not null check (target > 0),
  raised      integer not null default 0 check (raised >= 0),
  members     integer not null default 0 check (members >= 0),
  closes_at   timestamptz not null default now() + interval '7 days',
  status      text not null default 'open' check (status in ('open', 'funded', 'cancelled')),
  created_at  timestamptz not null default now()
);

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  reference   text not null unique,
  -- whole naira
  amount      integer not null check (amount > 0),
  status      text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at  timestamptz not null default now(),
  paid_at     timestamptz
);

create sequence public.order_code_seq start 1001;

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique default 'FD-' || nextval('public.order_code_seq'),
  customer_id   uuid not null references public.profiles (id) on delete restrict,
  -- copied at checkout so the farm can see who to deliver to without reading profiles
  customer_name text not null default '',
  farm_id       uuid not null references public.farms (id) on delete restrict,
  payment_id    uuid references public.payments (id) on delete set null,
  status        text not null default 'Awaiting payment'
                check (status in ('Awaiting payment', 'Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled')),
  total         integer not null check (total > 0),
  address       text not null default '',
  created_at    timestamptz not null default now()
);

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete set null,
  pool_id     uuid references public.pools (id) on delete set null,
  kind        text not null check (kind in ('crop', 'animal', 'pool')),
  title       text not null,
  detail      text not null default '',
  image       text not null default '',
  unit_price  integer not null check (unit_price > 0),
  qty         integer not null check (qty between 1 and 99)
);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  -- filled in by a trigger from the reviewer's profile, so it cannot be faked
  author_name text not null default '',
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null default '' check (char_length(comment) <= 1000),
  created_at  timestamptz not null default now(),
  -- one review per customer per product
  unique (product_id, customer_id)
);

-- Counters used by the edge functions to rate-limit callers.
create table public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 1,
  primary key (key, window_start)
);

create index on public.products (farm_id);
create index on public.products (status);
create index on public.pools (product_id);
create index on public.orders (customer_id);
create index on public.orders (farm_id);
create index on public.orders (payment_id);
create index on public.order_items (order_id);
create index on public.order_items (product_id);
create index on public.reviews (product_id);
create index on public.payments (customer_id);

-- -------------------------- Helper functions --------------------------
-- "security definer" functions run with the owner's rights, so they can
-- look things up that the caller cannot. Each pins search_path so it
-- cannot be tricked into using a look-alike table.

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'active'
  );
$$;

-- The farm owned by the signed-in user (null if none, or if suspended).
create function public.my_farm_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select f.id
  from public.farms f
  join public.profiles p on p.id = f.owner_id
  where f.owner_id = (select auth.uid()) and p.status = 'active';
$$;

-- ------------------------------ Triggers ------------------------------

-- A new sign-up gets a profile (and a farm awaiting verification, for
-- farmers). Nobody can sign themselves up as an admin.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'customer');
begin
  if v_role not in ('customer', 'farmer') then
    v_role := 'customer';
  end if;

  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    v_role,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(coalesce(new.email, ''), 320)
  );

  if v_role = 'farmer' then
    insert into public.farms (owner_id, name, location)
    values (
      new.id,
      left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'farm_name'), ''), 'My Farm'), 120),
      left(coalesce(new.raw_user_meta_data ->> 'farm_location', ''), 160)
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their name, phone and address — never their role,
-- status or email. Only admins (or the server) can change those.
create function public.protect_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.id := old.id;
    new.role := old.role;
    new.status := old.status;
    new.email := old.email;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile();

-- Farmers may rename their farm — never verify it or hand it to someone else.
create function public.protect_farm()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.status := old.status;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger protect_farm
  before update on public.farms
  for each row execute function public.protect_farm();

-- New listings always start as "pending" and farmers cannot approve
-- their own. Also stops a farm flooding the marketplace with listings.
create function public.protect_product_insert()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.status := 'pending';
    new.created_at := now();
    if (
      select count(*) from public.products
      where farm_id = new.farm_id and created_at > now() - interval '1 hour'
    ) >= 30 then
      raise exception 'Too many new listings. Please try again later.';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_product_insert
  before insert on public.products
  for each row execute function public.protect_product_insert();

create function public.protect_product_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.id := old.id;
    new.farm_id := old.farm_id;
    new.created_at := old.created_at;
    -- The only status changes a farmer may make: pause / resume a live
    -- listing, or send a rejected one back for another review.
    if new.status is distinct from old.status and not (
      (old.status = 'live' and new.status = 'paused') or
      (old.status = 'paused' and new.status = 'live') or
      (old.status = 'rejected' and new.status = 'pending')
    ) then
      raise exception 'Only an admin can change a listing to "%".', new.status;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_product_update
  before update on public.products
  for each row execute function public.protect_product_update();

-- A review is always written as the signed-in customer, under their real name.
create function public.stamp_review()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.customer_id := (select auth.uid());
    if tg_op = 'UPDATE' then
      new.product_id := old.product_id;
      new.created_at := old.created_at;
    else
      new.created_at := now();
    end if;
  end if;
  new.author_name := coalesce(
    (select nullif(trim(full_name), '') from public.profiles where id = new.customer_id),
    'FarmDirect customer'
  );
  return new;
end;
$$;

create trigger stamp_review
  before insert or update on public.reviews
  for each row execute function public.stamp_review();

-- ------------------------- Row level security -------------------------

alter table public.profiles    enable row level security;
alter table public.farms       enable row level security;
alter table public.products    enable row level security;
alter table public.pools       enable row level security;
alter table public.payments    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews     enable row level security;
alter table public.rate_limits enable row level security;
-- rate_limits has no policies on purpose: only the server can touch it.

-- profiles: you see and edit your own; admins see and edit all.
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- farms: everyone sees verified farms; owners see their own; admins see all.
create policy "farms: read verified, own or admin" on public.farms
  for select to anon, authenticated
  using (status = 'verified' or owner_id = (select auth.uid()) or public.is_admin());

create policy "farms: update own or admin" on public.farms
  for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (owner_id = (select auth.uid()) or public.is_admin());

create policy "farms: admin delete" on public.farms
  for delete to authenticated
  using (public.is_admin());

-- products: shoppers see live listings from verified farms only.
create policy "products: read live, own or admin" on public.products
  for select to anon, authenticated
  using (
    public.is_admin()
    or farm_id = public.my_farm_id()
    or (
      status = 'live'
      and exists (select 1 from public.farms f where f.id = farm_id and f.status = 'verified')
    )
  );

create policy "products: farm owner or admin insert" on public.products
  for insert to authenticated
  with check (farm_id = public.my_farm_id() or public.is_admin());

create policy "products: farm owner or admin update" on public.products
  for update to authenticated
  using (farm_id = public.my_farm_id() or public.is_admin())
  with check (farm_id = public.my_farm_id() or public.is_admin());

create policy "products: farm owner or admin delete" on public.products
  for delete to authenticated
  using (farm_id = public.my_farm_id() or public.is_admin());

-- pools: public to read. Created and funded only by the checkout /
-- payment functions; admins can edit or remove them.
create policy "pools: public read" on public.pools
  for select to anon, authenticated
  using (true);

create policy "pools: admin update" on public.pools
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "pools: admin delete" on public.pools
  for delete to authenticated
  using (public.is_admin());

-- payments: read-only for the payer and admins. Written by the server.
create policy "payments: read own or admin" on public.payments
  for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_admin());

-- orders: the customer, the farm fulfilling it, and admins can read.
-- There are NO insert/update policies: orders are created by the
-- checkout function and moved along by advance_order() below.
create policy "orders: read own, own farm or admin" on public.orders
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or farm_id = public.my_farm_id()
    or public.is_admin()
  );

create policy "order_items: read if the order is readable" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- reviews: anyone can read. You can only review a product you have
-- actually received (a Delivered order containing it).
create policy "reviews: public read" on public.reviews
  for select to anon, authenticated
  using (true);

create policy "reviews: verified buyers insert" on public.reviews
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.status = 'active'
    )
    and exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.customer_id = (select auth.uid())
        and o.status = 'Delivered'
        and oi.product_id = reviews.product_id
    )
  );

create policy "reviews: update own" on public.reviews
  for update to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

create policy "reviews: delete own or admin" on public.reviews
  for delete to authenticated
  using (customer_id = (select auth.uid()) or public.is_admin());

-- ----------------------- Server-checked actions -----------------------

-- Moves an order to a new status, allowing only the steps each role may take:
--   customer: cancel before paying; confirm receipt once dispatched
--   farmer:   confirm a paid order; mark it dispatched
--   admin:    any status
create function public.advance_order(p_order_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Sign in first.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.';
  end if;

  if public.is_admin() then
    if p_status not in ('Awaiting payment', 'Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled') then
      raise exception 'Unknown status.';
    end if;
  elsif v_order.customer_id = v_uid then
    if not (
      (v_order.status = 'Awaiting payment' and p_status = 'Cancelled') or
      (v_order.status = 'Dispatched' and p_status = 'Delivered')
    ) then
      raise exception 'You cannot change this order to "%".', p_status;
    end if;
  elsif v_order.farm_id = public.my_farm_id() then
    if not (
      (v_order.status = 'Placed' and p_status = 'Confirmed') or
      (v_order.status = 'Confirmed' and p_status = 'Dispatched')
    ) then
      raise exception 'You cannot change this order to "%".', p_status;
    end if;
  else
    raise exception 'Order not found.';
  end if;

  update public.orders set status = p_status where id = p_order_id;
end;
$$;

revoke execute on function public.advance_order(uuid, text) from public, anon;
grant execute on function public.advance_order(uuid, text) to authenticated;

-- Marks a payment as paid and releases its orders. Called only by the
-- payment functions after Paystack has confirmed the money arrived.
-- Safe to call twice: the second call does nothing.
create function public.confirm_payment(p_reference text, p_amount_kobo bigint)
returns text
language plpgsql security definer set search_path = ''
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
  -- The amount Paystack collected must match what we asked for.
  if p_amount_kobo <> v_payment.amount::bigint * 100 then
    update public.payments set status = 'failed' where id = v_payment.id;
    return 'amount_mismatch';
  end if;

  update public.payments set status = 'success', paid_at = now() where id = v_payment.id;

  update public.orders set status = 'Placed'
  where payment_id = v_payment.id and status = 'Awaiting payment';

  -- Count pool shares towards their pools.
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

-- Returns true if the caller identified by p_key is still under p_max
-- requests in the current window, and counts this request.
create function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into v_count;

  -- Occasionally clear out old counters.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$$;

-- These two are for the server only.
revoke execute on function public.confirm_payment(text, bigint) from public, anon, authenticated;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.confirm_payment(text, bigint) to service_role;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- Trigger functions are never meant to be called directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile() from public, anon, authenticated;
revoke execute on function public.protect_farm() from public, anon, authenticated;
revoke execute on function public.protect_product_insert() from public, anon, authenticated;
revoke execute on function public.protect_product_update() from public, anon, authenticated;
revoke execute on function public.stamp_review() from public, anon, authenticated;

-- The order-number sequence is used by the server only.
revoke all on sequence public.order_code_seq from anon, authenticated;
