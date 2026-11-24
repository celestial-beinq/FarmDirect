-- Input hardening: rules the database enforces on every write, whoever makes it.
--
-- The website cleans what people type, but anyone can skip the website and call
-- the database directly with the public key. These checks are what actually stop
-- bad data. They are added NOT VALID: every new insert/update must pass them,
-- but existing rows are not re-checked (so this migration cannot fail on old data).

-- ---------- Helpers ----------

-- A photo/document link we are willing to store and show:
--   ''                                   no photo
--   /images/name.jpg                     a photo shipped with the site
--   https://host/path                    e.g. Supabase Storage (no spaces/quotes/<>)
--   1592924357228-91a4daadcfea            a legacy Unsplash photo id
-- Anything else ("javascript:", "//evil.com", data: URLs, HTML) is refused.
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

-- Every entry of a list of links is safe, and the list is a sensible size.
create or replace function public.are_safe_links(values text[])
returns boolean
language sql immutable parallel safe set search_path = ''
as $$
  select values is not null
    and cardinality(values) <= 12
    and coalesce((select bool_and(public.is_safe_link(v)) from unnest(values) as v), true);
$$;

-- A short list of short labels (tags, highlights).
create or replace function public.are_short_labels(values text[], max_items int, max_len int)
returns boolean
language sql immutable parallel safe set search_path = ''
as $$
  select values is not null
    and cardinality(values) <= max_items
    and coalesce((select bool_and(char_length(v) <= max_len and v !~ '[<>]') from unnest(values) as v), true);
$$;

-- No HTML tags in plain-text fields. Angular already shows text safely, but this
-- keeps stored data clean for anything else that reads it (emails, exports).
create or replace function public.is_plain_text(value text)
returns boolean
language sql immutable parallel safe set search_path = ''
as $$
  select value is null or value !~* '<\s*/?\s*(script|iframe|object|embed|svg|img|style|link|meta|form)\b';
$$;

-- ---------- Products ----------
alter table public.products drop constraint if exists products_image_safe;
alter table public.products add constraint products_image_safe
  check (public.is_safe_link(image)) not valid;

alter table public.products drop constraint if exists products_gallery_safe;
alter table public.products add constraint products_gallery_safe
  check (public.are_safe_links(gallery)) not valid;

alter table public.products drop constraint if exists products_tags_short;
alter table public.products add constraint products_tags_short
  check (public.are_short_labels(tags, 10, 40)) not valid;

alter table public.products drop constraint if exists products_highlights_short;
alter table public.products add constraint products_highlights_short
  check (public.are_short_labels(highlights, 10, 120)) not valid;

alter table public.products drop constraint if exists products_text_plain;
alter table public.products add constraint products_text_plain
  check (public.is_plain_text(name) and public.is_plain_text(description) and public.is_plain_text(unit)) not valid;

alter table public.products drop constraint if exists products_stock_range;
alter table public.products add constraint products_stock_range
  check (quantity between 0 and 1000000) not valid;

-- ---------- Farms (KYC) ----------
alter table public.farms drop constraint if exists farms_document_safe;
alter table public.farms add constraint farms_document_safe
  check (public.is_safe_link(document_url)) not valid;

-- A Nigerian NIN is 11 digits; allow empty until the farmer submits it.
alter table public.farms drop constraint if exists farms_nin_digits;
alter table public.farms add constraint farms_nin_digits
  check (nin = '' or nin ~ '^[0-9]{11}$') not valid;

alter table public.farms drop constraint if exists farms_text_plain;
alter table public.farms add constraint farms_text_plain
  check (
    public.is_plain_text(name) and public.is_plain_text(location)
    and public.is_plain_text(residential_address) and public.is_plain_text(farm_size)
    and public.is_plain_text(crop_produces) and public.is_plain_text(verification_notes)
  ) not valid;

-- ---------- Profiles ----------
alter table public.profiles drop constraint if exists profiles_phone_chars;
alter table public.profiles add constraint profiles_phone_chars
  check (phone ~ '^[0-9+() -]*$') not valid;

alter table public.profiles drop constraint if exists profiles_text_plain;
alter table public.profiles add constraint profiles_text_plain
  check (public.is_plain_text(full_name) and public.is_plain_text(address)) not valid;

-- ---------- Reviews ----------
alter table public.reviews drop constraint if exists reviews_text_plain;
alter table public.reviews add constraint reviews_text_plain
  check (char_length(author_name) <= 120 and public.is_plain_text(comment)) not valid;

-- ---------- Orders (written only by the checkout function, but bound them anyway) ----------
alter table public.orders drop constraint if exists orders_text_bounds;
alter table public.orders add constraint orders_text_bounds
  check (char_length(customer_name) <= 120 and char_length(address) <= 300) not valid;

alter table public.order_items drop constraint if exists order_items_text_bounds;
alter table public.order_items add constraint order_items_text_bounds
  check (char_length(title) <= 200 and char_length(detail) <= 120 and public.is_safe_link(image)) not valid;
