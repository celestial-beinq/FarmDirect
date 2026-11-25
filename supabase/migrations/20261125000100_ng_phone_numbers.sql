-- Phone numbers: 11 digits starting with 0, e.g. 08031234567 (or empty).
--
-- The app already only accepts this, but the database checks too, because
-- anyone can call it directly. A trigger is used rather than a CHECK
-- constraint so that older numbers saved with spaces don't block unrelated
-- updates (an admin suspending an account, a settings change): the rule only
-- runs when the phone itself is being set.

create or replace function public.normalize_ng_phone(value text)
returns text
language sql immutable parallel safe set search_path = ''
as $$
  select case
    -- +234 803 123 4567  ->  08031234567
    when d ~ '^234[0-9]{10}$' then '0' || substr(d, 4)
    -- 803 123 4567 (leading 0 dropped)  ->  08031234567
    when d ~ '^[1-9][0-9]{9}$' then '0' || d
    else d
  end
  from (select regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g') as d) as cleaned;
$$;

create or replace function public.check_profile_phone()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.phone := public.normalize_ng_phone(new.phone);
  if new.phone <> '' and new.phone !~ '^0[0-9]{10}$' then
    raise exception 'Enter an 11-digit phone number, e.g. 08031234567.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists check_profile_phone on public.profiles;
create trigger check_profile_phone
  before insert or update of phone on public.profiles
  for each row execute function public.check_profile_phone();

-- Tidy numbers already saved, where they can be read as a Nigerian number.
-- Anything that can't is left exactly as it is (the person can fix it next
-- time they edit their profile).
update public.profiles
set phone = public.normalize_ng_phone(phone)
where phone <> ''
  and phone <> public.normalize_ng_phone(phone)
  and public.normalize_ng_phone(phone) ~ '^0[0-9]{10}$';
