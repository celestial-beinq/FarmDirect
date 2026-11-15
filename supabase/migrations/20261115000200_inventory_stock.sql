-- =====================================================================
-- Inventory & Stock Management:
--   * Adds available quantity (baskets / kg / units) to products.
--   * Decrements quantity on completed order payments.
--   * Allows farmers to update their stock quantities.
-- =====================================================================

-- 1. Add quantity column if not present
alter table public.products
  add column if not exists quantity integer not null default 0 check (quantity >= 0);

-- Backfill default realistic quantities for existing products if they are 0
update public.products
set quantity = case
  when name ilike '%tomato%' then 20
  when name ilike '%carrot%' then 4
  when name ilike '%pepper%' then 15
  when name ilike '%spinach%' or name ilike '%ugu%' then 3
  when name ilike '%rice%' then 35
  when name ilike '%mango%' then 8
  when name ilike '%watermelon%' then 12
  when name ilike '%box%' or name ilike '%basket%' then 10
  else 25
end
where kind = 'crop' and quantity = 0;

-- 2. Function for farmers/admins to quickly update stock quantity
create or replace function public.update_product_stock(p_product_id uuid, p_quantity integer)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_farm_id uuid;
begin
  if p_quantity < 0 then
    raise exception 'Quantity cannot be negative.';
  end if;

  select farm_id into v_farm_id from public.products where id = p_product_id;
  if not found then
    raise exception 'Product not found.';
  end if;

  if not (public.is_admin() or v_farm_id = public.my_farm_id()) then
    raise exception 'You do not have permission to update stock for this product.';
  end if;

  update public.products
  set quantity = p_quantity
  where id = p_product_id;
end;
$$;

revoke execute on function public.update_product_stock(uuid, integer) from public, anon;
grant execute on function public.update_product_stock(uuid, integer) to authenticated;

-- 3. Update confirm_payment to decrement product quantities when orders are paid
create or replace function public.confirm_payment(p_reference text, p_amount_kobo bigint)
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

  -- Decrement product quantities for purchased crops/products
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
