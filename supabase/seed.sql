-- Sample catalogue so the marketplace is not empty on first run.
-- This is PLACEHOLDER data (made-up farms, prices and pools). It is optional:
-- run it once in the SQL editor, or skip it and add real farms instead.
-- Sample farms have no owner account; real farmers get their own farm at sign-up.

insert into public.farms (id, name, location, status) values
  ('00000000-0000-4000-8000-000000000001', 'Ogun Valley Farm', 'Abeokuta, Ogun State', 'verified'),
  ('00000000-0000-4000-8000-000000000002', 'Plateau Fresh Growers', 'Jos, Plateau State', 'verified'),
  ('00000000-0000-4000-8000-000000000003', 'Arewa Harvest Co-op', 'Kano, Kano State', 'verified'),
  ('00000000-0000-4000-8000-000000000004', 'Benue Orchards', 'Makurdi, Benue State', 'verified'),
  ('00000000-0000-4000-8000-000000000005', 'Sahel Livestock Ranch', 'Zaria, Kaduna State', 'verified')
on conflict (id) do nothing;

insert into public.products
  (farm_id, kind, name, category, price, unit, description, image, gallery, tags, highlights, status)
values
  ('00000000-0000-4000-8000-000000000001', 'crop', 'Vine-Ripened Tomatoes', 'Vegetables', 1200, 'kg', 'Plump, sun-ripened Nigerian tomatoes harvested at peak flavour. Firm skin and rich juice — right for jollof rice, stews or fresh salads.', '1592924357228-91a4daadcfea', array['1592924357228-91a4daadcfea', '1464226184884-fa280b87c399', '1488459716781-31db52582fe9', '1560493676-04071c5f467b']::text[], array['By Weight', 'Basket Available']::text[], array['Grown without synthetic pesticides', 'Harvested to order, not stored', 'Sorted by hand before packing']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000002', 'crop', 'Crunchy Carrots', 'Vegetables', 850, 'kg', 'Sweet, crunchy carrots from the cool Jos plateau. Delivered with their tops on so you can see how fresh they are.', '1598170845058-32b9d6a5da37', array['1598170845058-32b9d6a5da37', '1464226184884-fa280b87c399', '1488459716781-31db52582fe9', '1560493676-04071c5f467b']::text[], array['By Weight', 'Direct Farm']::text[], array['Grown without synthetic pesticides', 'Harvested to order, not stored', 'Washed in clean water at the farm']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000002', 'crop', 'Irish Potatoes', 'Tubers', 900, 'kg', 'Firm Irish potatoes dug the week you order. Even sized and clean skinned — good for chips, boiling or potato porridge.', '1518977676601-b53f82aba655', array['1518977676601-b53f82aba655', '1488459716781-31db52582fe9', '1560493676-04071c5f467b', '1500382017468-9049fed747ef']::text[], array['By Weight', 'Bulk Pricing']::text[], array['Dug the week of delivery', 'No sprouting inhibitors used', 'Sorted for even size']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000003', 'crop', 'Mixed Bell Peppers', 'Vegetables', 1800, 'kg', 'A colourful mix of sweet bell peppers. Thick walled and crisp — they hold up in stir fries, stews and salads.', '1563565375-f3fdfdbefa83', array['1563565375-f3fdfdbefa83', '1464226184884-fa280b87c399', '1488459716781-31db52582fe9', '1560493676-04071c5f467b']::text[], array['By Weight']::text[], array['Grown without synthetic pesticides', 'Harvested to order, not stored', 'Mixed colours in every pack']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000003', 'crop', 'Red Chili (Shombo)', 'Vegetables', 1100, 'kg', 'Long red chili peppers with real heat and deep colour. Blend into your pepper mix or dry them for later.', '1583119022894-919a68a3d0e3', array['1583119022894-919a68a3d0e3', '1464226184884-fa280b87c399', '1488459716781-31db52582fe9', '1560493676-04071c5f467b']::text[], array['By Weight', 'Extra Hot']::text[], array['Grown without synthetic pesticides', 'Harvested to order, not stored', 'Naturally red — no colouring added']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000001', 'crop', 'Fresh Spinach Leaves', 'Vegetables', 400, 'bunch', 'Tender spinach cut the morning it ships and kept cool on the way to you. Good for efo riro, smoothies and stir fries.', '1576045057995-568f588f82fb', array['1576045057995-568f588f82fb', '1523348837708-15d4a09cfac2', '1488459716781-31db52582fe9', '1560493676-04071c5f467b']::text[], array['Fresh Cut']::text[], array['Cut the morning of dispatch', 'Irrigated with clean borehole water']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000001', 'crop', 'Local Ofada Rice', 'Grains', 2400, 'kg', 'Unpolished Ofada rice straight from the mill. Destoned and sealed at source — no plastic rice, no mixing with imported grain.', '1586201375761-83865001e31c', array['1586201375761-83865001e31c', '1574943320219-553eb213f72d', '1500937386664-56d1dfef3854', '1500382017468-9049fed747ef']::text[], array['By Weight', 'Stone-Free']::text[], array['Milled and bagged at source', 'Destoned twice', 'Nothing mixed in']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000004', 'crop', 'Sweet Mangoes', 'Fruits', 1500, 'kg', 'Juicy mangoes left to ripen on the tree. We never use calcium carbide or any other ripening chemical.', '1601493700631-2b16ec4b4716', array['1601493700631-2b16ec4b4716', '1610832958506-aa56368176cf', '1488459716781-31db52582fe9', '1500382017468-9049fed747ef']::text[], array['By Weight', 'In Season']::text[], array['Tree-ripened — no carbide', 'Picked 48 hours before delivery']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000004', 'crop', 'Sugarloaf Pineapple', 'Fruits', 1300, 'piece', 'Sweet, low-acid pineapple harvested ripe. Each one is checked by hand before it leaves the farm.', '1550258987-190a2d41a8ba', array['1550258987-190a2d41a8ba', '1610832958506-aa56368176cf', '1488459716781-31db52582fe9', '1500382017468-9049fed747ef']::text[], array['Per Piece', 'Bulk Pricing']::text[], array['Harvested ripe, not green', 'No ripening chemicals']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000003', 'crop', 'Watermelon', 'Fruits', 2200, 'piece', 'Large watermelons with deep red flesh. Nothing is injected — the sweetness comes from the field.', '1587049352846-4a222e784d38', array['1587049352846-4a222e784d38', '1610832958506-aa56368176cf', '1488459716781-31db52582fe9', '1500382017468-9049fed747ef']::text[], array['Per Piece', 'Bulk Pricing']::text[], array['Nothing injected', 'Average weight 6–8kg']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000002', 'crop', 'Weekly Vegetable Box', 'Vegetables', 12500, 'box', 'Assorted seasonal vegetables harvested for your order: tomatoes, peppers, carrots, greens and whatever is best that week.', '1464226184884-fa280b87c399', array['1464226184884-fa280b87c399', '1488459716781-31db52582fe9', '1598170845058-32b9d6a5da37', '1592924357228-91a4daadcfea']::text[], array['Mixed Box', 'Feeds a Family']::text[], array['Grown without synthetic pesticides', 'Harvested to order, not stored', 'Contents change with the season']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000004', 'crop', 'Tropical Fruit Basket', 'Fruits', 8800, 'basket', 'A mix of ripe seasonal fruit — pineapple, pawpaw, citrus, mango — picked for your order and packed the same day.', '1610832958506-aa56368176cf', array['1610832958506-aa56368176cf', '1601493700631-2b16ec4b4716', '1550258987-190a2d41a8ba', '1587049352846-4a222e784d38']::text[], array['Mixed Basket', 'In Season']::text[], array['Naturally ripened', 'Packed the day it is picked']::text[], 'live'),
  ('00000000-0000-4000-8000-000000000001', 'crop', 'Ugu (Pumpkin Leaves)', 'Vegetables', 500, 'bunch', 'Fresh ugu leaves cut on the morning of dispatch.', '1576045057995-568f588f82fb', array['1576045057995-568f588f82fb']::text[], array['Fresh Cut']::text[], '{}'::text[], 'pending');

insert into public.products
  (farm_id, kind, name, category, price, unit, description, image, gallery, weight, yield_kg, min_share, status)
values
  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Friesian Cross Cow', 'Cow', 500000, 'animal', 'Healthy cow raised in Kaduna, checked by a vet before sale.', '1570042225831-d98fa7577f1e', array['1570042225831-d98fa7577f1e', '1527153857715-3908f2bae5e8', '1500382017468-9049fed747ef']::text[], '280–320kg', 180, 25000, 'live'),
  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Brown Cross Cow', 'Cow', 450000, 'animal', 'Healthy cow raised in Adamawa, checked by a vet before sale.', '1527153857715-3908f2bae5e8', array['1527153857715-3908f2bae5e8', '1570042225831-d98fa7577f1e', '1500382017468-9049fed747ef']::text[], '250–290kg', 160, 25000, 'live'),
  ('00000000-0000-4000-8000-000000000005', 'livestock', 'White Sahel Goat', 'Goat', 75000, 'animal', 'Healthy goat raised in Kano, checked by a vet before sale.', '1524024973431-2ad916746881', array['1524024973431-2ad916746881', '1500382017468-9049fed747ef']::text[], '25–35kg', 14, 15000, 'live'),
  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Pasture-Raised Ram', 'Ram', 180000, 'animal', 'Healthy ram raised in Sokoto, checked by a vet before sale.', '1484557985045-edf25e08da73', array['1484557985045-edf25e08da73', '1500382017468-9049fed747ef']::text[], '45–60kg', 28, 20000, 'live');

insert into public.pools (product_id, name, target, raised, members, closes_at)
select id, 'Lagos Island Group 04', price, 350000, 15, now() + interval '2 days'
from public.products where name = 'Friesian Cross Cow' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at)
select id, 'Abuja Central – Bulk 2', price, 225000, 6, now() + interval '5 days'
from public.products where name = 'Friesian Cross Cow' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at)
select id, 'Ikeja Early Bird Shared', price, 460000, 21, now() + interval '4 hours'
from public.products where name = 'Friesian Cross Cow' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at)
select id, 'Lekki Families Pool', price, 180000, 7, now() + interval '6 days'
from public.products where name = 'Brown Cross Cow' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at)
select id, 'Surulere Goat Share', price, 45000, 3, now() + interval '3 days'
from public.products where name = 'White Sahel Goat' and kind = 'livestock' limit 1;

