-- Structured delivery address: state, local government area, city/town, street
-- and a nearby landmark, kept as separate fields so riders get complete,
-- consistent addresses.
--
-- profiles.address stays as the full address written out in one line. The app
-- fills it from these parts, and checkout copies it onto each order, so nothing
-- downstream has to change. The limits below keep that line within its 300
-- characters.

alter table public.profiles
  add column if not exists address_street   text not null default '',
  add column if not exists address_landmark text not null default '',
  add column if not exists address_city     text not null default '',
  add column if not exists address_lga      text not null default '',
  add column if not exists address_state    text not null default '';

alter table public.profiles drop constraint if exists profiles_address_parts;
alter table public.profiles add constraint profiles_address_parts check (
  char_length(address_street) <= 120
  and char_length(address_landmark) <= 60
  and char_length(address_city) <= 50
  and char_length(address_lga) <= 40
  and char_length(address_state) <= 20
  and public.is_plain_text(address_street)
  and public.is_plain_text(address_landmark)
  and public.is_plain_text(address_city)
);
