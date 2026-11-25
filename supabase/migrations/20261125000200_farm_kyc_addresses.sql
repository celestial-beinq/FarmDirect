-- Farmer KYC: structured home and farmland addresses.
--
--   residential_address  the farmer's home address on one line (existing column)
--   farm_address         NEW: the farmland's full address on one line
--   location             (existing) stays short, e.g. "Abeokuta, Ogun State";
--                        produce cards show it as the item's origin
--   address_parts        NEW: both addresses field by field (state, LGA, city,
--                        street, landmark) so the form re-opens filled in
--
-- The protect_farm trigger already stops farmers changing their status or
-- verification notes; these new columns are theirs to edit.

alter table public.farms
  add column if not exists farm_address  text  not null default '',
  add column if not exists address_parts jsonb not null default '{}'::jsonb;

alter table public.farms drop constraint if exists farms_farm_address_safe;
alter table public.farms add constraint farms_farm_address_safe check (
  char_length(farm_address) <= 300 and public.is_plain_text(farm_address)
);

alter table public.farms drop constraint if exists farms_address_parts_shape;
alter table public.farms add constraint farms_address_parts_shape check (
  jsonb_typeof(address_parts) = 'object'
  and pg_column_size(address_parts) <= 2048
  and public.is_plain_text(address_parts::text)
);
