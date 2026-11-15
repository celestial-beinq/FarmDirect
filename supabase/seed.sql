-- Sample catalogue so the marketplace is rich with authentic Nigerian agricultural foods.
-- This data represents authentic produce, fruits, vegetables, tubers, grains, and livestock eaten across Nigeria.

insert into public.farms (id, name, location, status) values
  ('00000000-0000-4000-8000-000000000001', 'Ogun Valley Farm', 'Abeokuta, Ogun State', 'verified'),
  ('00000000-0000-4000-8000-000000000002', 'Plateau Fresh Growers', 'Jos, Plateau State', 'verified'),
  ('00000000-0000-4000-8000-000000000003', 'Arewa Harvest Co-op', 'Kano, Kano State', 'verified'),
  ('00000000-0000-4000-8000-000000000004', 'Benue Orchards & Roots', 'Makurdi, Benue State', 'verified'),
  ('00000000-0000-4000-8000-000000000005', 'Sahel Livestock Ranch', 'Zaria, Kaduna State', 'verified'),
  ('00000000-0000-4000-8000-000000000006', 'Greenfield Edo Groves', 'Benin City, Edo State', 'verified'),
  ('00000000-0000-4000-8000-000000000007', 'Ebonyi River Basin Co-op', 'Abakaliki, Ebonyi State', 'verified'),
  ('00000000-0000-4000-8000-000000000008', 'Nsukka Agro Heritage', 'Nsukka, Enugu State', 'verified'),
  ('00000000-0000-4000-8000-000000000009', 'Oyo Heritage Tropicals', 'Oyo, Oyo State', 'verified')
on conflict (id) do nothing;

-- ----------------------- CROPS -----------------------
insert into public.products
  (farm_id, kind, name, category, price, unit, description, image, gallery, tags, highlights, status)
values
  -- Vegetables
  ('00000000-0000-4000-8000-000000000002', 'crop', 'Vine-Ripened Plum Tomatoes', 'Vegetables', 1200, 'kg',
   'Firm, deep-crimson Nigerian plum tomatoes with thick meat and sweet natural aroma. Ideal base for authentic party jollof rice and stews.',
   '1592924357228-91a4daadcfea', array['1592924357228-91a4daadcfea', '1464226184884-fa280b87c399']::text[],
   array['By Weight', 'Basket Available', 'Stew Essential']::text[],
   array['Pesticide-free', 'Harvested Thursday to order', 'Sorted by hand into crates']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Fresh Ugu Leaves (Fluted Pumpkin)', 'Vegetables', 600, 'bunch',
   'Crisp, deep-green fluted pumpkin leaves (Telfairia occidentalis) harvested at dawn. Nutrient-dense, essential for Egusi, Edikang Ikong, and Ogbono soups.',
   '1576045057995-568f588f82fb', array['1576045057995-568f588f82fb', '1540420773420-3366772f4999']::text[],
   array['Fresh Cut', 'Soup Staple']::text[],
   array['Cut fresh at dawn', 'Clean borehole irrigation', 'Pesticide free']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Fresh Ewedu Leaves (Jute Mallow)', 'Vegetables', 450, 'bunch',
   'Young, tender jute leaves harvested on dispatch morning. High natural mucilage that cooks into vibrant green, slippery draw soup for hot amala.',
   '1540420773420-3366772f4999', array['1540420773420-3366772f4999']::text[],
   array['Fresh Cut', 'High Draw']::text[],
   array['Harvested same morning', 'Young tender tips', 'Rich natural draw']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Efo Shoko (Lagos Green Spinach)', 'Vegetables', 500, 'bunch',
   'Broad, crisp Lagos greens (Celosia argentea). Retains deep green chlorophyll and bite during cooking for authentic Yoruba Efo Riro.',
   '1576045057995-568f588f82fb', array['1576045057995-568f588f82fb']::text[],
   array['Fresh Cut', 'Efo Riro Special']::text[],
   array['Borehole watered', 'Cut same morning', 'Dirt & sand washed']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Fresh Ata Rodo (Scotch Bonnet)', 'Vegetables', 1600, 'kg',
   'Fiery, fragrant yellow and red Nigerian scotch bonnet peppers. Grown from heirloom northern seeds for authentic peppery heat and floral aroma.',
   '1588252303782-cb80119abd6d', array['1588252303782-cb80119abd6d']::text[],
   array['Extra Hot', 'By Weight', 'Aromatic']::text[],
   array['Heirloom seeds', 'Intense aroma and heat', 'Hand-sorted pods']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Sweet Tatashe (Red Bell Pepper)', 'Vegetables', 1800, 'kg',
   'Thick-walled, deep-crimson sweet tatashe peppers from the cool Jos hills. Imparts rich red pigment and mild sweetness to pepper blends.',
   '1563565375-f3fdfdbefa83', array['1563565375-f3fdfdbefa83']::text[],
   array['By Weight', 'Jollof Color']::text[],
   array['Naturally sweetened', 'Thick juicy walls', 'Grade A sorting']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Red Shombo Chili Peppers', 'Vegetables', 1100, 'kg',
   'Long cayenne chili peppers with rich scarlet pigment and sharp spice. Great for balancing heat and colour in pepper soups and suya marinades.',
   '1583119022894-919a68a3d0e3', array['1583119022894-919a68a3d0e3']::text[],
   array['Extra Hot', 'By Weight']::text[],
   array['Pure heirloom seed', 'Hand-picked', 'Zero colour additives']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000009', 'crop', 'Fresh Tender Okra (Ila / Okwuru)', 'Vegetables', 950, 'kg',
   'Young, snappy green ladyfinger okra pods harvested daily. Highly tender with excellent draw, delicious in seafood okra or ila alasepo.',
   '1425543103986-22abb7d7e8d2', array['1425543103986-22abb7d7e8d2']::text[],
   array['By Weight', 'High Draw']::text[],
   array['Daily fresh harvest', 'Snappy tender tips', 'No woody pods']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000008', 'crop', 'Washed Bitterleaf (Onugbu)', 'Vegetables', 750, 'bunch',
   'Traditionally washed and squeeze-drained fresh bitterleaf. Balanced mild bitterness preserved for authentic Ofe Onugbu and herbal soups.',
   '1540420773420-3366772f4999', array['1540420773420-3366772f4999']::text[],
   array['Ready to Cook', 'Debittered']::text[],
   array['Traditionally washed', 'Ready to cook', 'Retains herbal aroma']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Crunchy Jos Carrots & Cabbage', 'Vegetables', 850, 'kg',
   'Sweet, crunchy carrots and dense heads of green cabbage grown in the cool mountain climate of Plateau. Clean-washed and packed crisp.',
   '1598170845058-32b9d6a5da37', array['1598170845058-32b9d6a5da37']::text[],
   array['By Weight', 'Direct Farm']::text[],
   array['Clean washed', 'No synthetic pesticides', 'Crisp fresh tops']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000008', 'crop', 'Green Garden Egg (Anara) Basket', 'Vegetables', 1200, 'basket',
   'Fresh, crunchy ivory and green garden eggs. Enjoy fresh with groundnut paste (ose oji) or simmered into rich garden egg sauce with boiled yam.',
   '1464226184884-fa280b87c399', array['1464226184884-fa280b87c399']::text[],
   array['Traditional', 'By Basket']::text[],
   array['Hand-sorted', 'Crunchy & firm', 'Great fiber source']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Weekly Nigerian Soup Basket', 'Vegetables', 14500, 'box',
   'A complete Nigerian family week pack: 5kg plum tomatoes, 2kg tatashe, 1kg rodo, 3 bunches ugu leaves, 2 bunches ewedu, carrots and sweet potatoes.',
   '1464226184884-fa280b87c399', array['1464226184884-fa280b87c399']::text[],
   array['Family Pack', 'Mixed Box']::text[],
   array['Feeds a family of 5 for a week', 'Save 15% vs single items', 'Harvested Thursday']::text[], 'live'),

  -- Fruits
  ('00000000-0000-4000-8000-000000000004', 'crop', 'Sweet Benue Mangoes (Peter & Julie)', 'Fruits', 1500, 'kg',
   'Rich, golden, fiberless sweet mangoes tree-ripened in Benue orchards. Guaranteed zero calcium carbide — pure, intense tropical fruit nectar.',
   '1601493700631-2b16ec4b4716', array['1601493700631-2b16ec4b4716']::text[],
   array['In Season', 'Tree Ripened', 'Carbide Free']::text[],
   array['Zero calcium carbide', 'Tree ripened', 'Fresh 48h harvest']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Ripe Sweet Plantains (Dodo Bunches)', 'Fruits', 2200, 'bunch',
   'Plump, naturally ripened sweet plantains from Edo rainforest plantations. Golden pulp with spots of sugar ripening for sweet fried dodo or bole.',
   '1571771894821-ce9b6c11b08e', array['1571771894821-ce9b6c11b08e']::text[],
   array['Sweet Dodo', 'Tree Ripened']::text[],
   array['Naturally tree ripened', 'No chemical accelerators', 'Heavy meaty fingers']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Green Unripe Cooking Plantains', 'Fruits', 1900, 'bunch',
   'Firm green plantains loaded with resistant starch and minerals. Prized for diabetic-friendly boiled plantain, goat meat plantain pepper soup (ukodo), or flour.',
   '1528825871115-3581a5387919', array['1528825871115-3581a5387919']::text[],
   array['Resistant Starch', 'Plantain Porridge']::text[],
   array['Firm green harvest', 'Cut Thursday before shipping', 'Zero bruises']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Sugarloaf Honey Pineapple', 'Fruits', 1300, 'piece',
   'Low-acid, sweet sugarloaf pineapple packed right after cutting. Golden yellow flesh with soft edible core and intense natural sweetness.',
   '1550258987-190a2d41a8ba', array['1550258987-190a2d41a8ba']::text[],
   array['Per Piece', 'Sweet']::text[],
   array['Naturally golden', 'High brix sweetness', 'Low stomach acidity']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Northern Sweet Red Watermelon', 'Fruits', 2200, 'piece',
   'Crisp, deep-red watermelons harvested from Kano riverbanks. Averaging 6 to 8kg, juicy and sweet with zero sugar injections or dye tampering.',
   '1587049352846-4a222e784d38', array['1587049352846-4a222e784d38']::text[],
   array['Per Piece', '6–8kg']::text[],
   array['No sugar injections', 'Field ripened', 'Crisp sweet flesh']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Sweet Gboko Oranges (Benue Valencia)', 'Fruits', 1400, 'basket',
   'Thin-skinned, highly juicy sweet oranges from Gboko orchards in Benue State. Renowned across Nigeria for their bursting natural sugar content.',
   '1557800636-894a64c1696f', array['1557800636-894a64c1696f']::text[],
   array['Juicy', 'By Basket']::text[],
   array['High juice yield', 'Thin skin', 'Naturally sweet']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000009', 'crop', 'African Star Apple (Agbalumo / Udara)', 'Fruits', 1800, 'basket',
   'Wild-foraged sweet-and-tangy agbalumo (Chrysophyllum albidum). Plump orange skin with sweet milky nectar and chewy seeds.',
   '1610832958506-aa56368176cf', array['1610832958506-aa56368176cf']::text[],
   array['Seasonal', 'By Basket']::text[],
   array['Wild-grove harvest', 'Naturally sweet pulp', 'Rich in Vitamin C']::text[], 'live'),

  -- Tubers
  ('00000000-0000-4000-8000-000000000004', 'crop', 'Benue White Pona Yam (New Harvest)', 'Tubers', 2800, 'tuber',
   'Genuine White Pona yam tubers from Benue State. Dry, floury, and starch-rich — pounds effortlessly into lump-free, stretchy pounded yam (iyan) or boiled yam.',
   '1596704017254-9b121068fb31', array['1596704017254-9b121068fb31', '1518977676601-b53f82aba655']::text[],
   array['Pounded Yam Special', 'Dry & Floury', 'Per Tuber']::text[],
   array['Food Basket of the Nation', 'Floury texture', 'Zero hollow centres']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Jos Highland Irish Potatoes', 'Tubers', 950, 'kg',
   'Firm Irish potatoes harvested from volcanic soils of the Jos plateau. Clean, uniform skin with high starch content, perfect for chips, boiling, or potato porridge.',
   '1518977676601-b53f82aba655', array['1518977676601-b53f82aba655']::text[],
   array['By Weight', 'Highland Grown']::text[],
   array['Dug weekly', 'No sprout inhibitors', 'Uniform medium-large sizes']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Plateau Orange Sweet Potatoes', 'Tubers', 750, 'kg',
   'Naturally sweet, moist orange-fleshed sweet potatoes loaded with beta-carotene. Delicious boiled, roasted, or fried as sweet chips.',
   '1596704017254-9b121068fb31', array['1596704017254-9b121068fb31']::text[],
   array['By Weight', 'Vitamin A']::text[],
   array['Naturally sweet', 'Dirt washed', 'Rich beta-carotene']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Fresh Cassava Tubers (Sweet Variety)', 'Tubers', 500, 'tuber',
   'Heavy, freshly dug sweet white cassava roots harvested specifically for your order. Perfect for fresh fufu, abacha shredding, or home starch processing.',
   '1518977676601-b53f82aba655', array['1518977676601-b53f82aba655']::text[],
   array['Fresh Dug', 'Per Tuber']::text[],
   array['Freshly harvested order day', 'Low-cyanide sweet cultivar', 'Firm white flesh']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000008', 'crop', 'Floury Cocoyam Tubers (Ede Ofe)', 'Tubers', 850, 'kg',
   'Starch-rich red and white cocoyam tubers (Colocasia esculenta). The premier authentic thickener for traditional Ofe Oha and Bitterleaf soup.',
   '1518977676601-b53f82aba655', array['1518977676601-b53f82aba655']::text[],
   array['Soup Thickener', 'By Weight']::text[],
   array['High starch content', 'Perfect soup thickener', 'Firm healthy corms']::text[], 'live'),

  -- Grains & Legumes
  ('00000000-0000-4000-8000-000000000001', 'crop', 'Local Ofada Rice (Double Destoned)', 'Grains', 2600, 'kg',
   'Traditional short-grain unpolished Ofada rice from Ogun millers. Machine-destoned twice to guarantee 100% stone-free grains with legendary nutty aroma.',
   '1586201375761-83865001e31c', array['1586201375761-83865001e31c']::text[],
   array['Stone-Free', 'Unpolished', 'Authentic Aroma']::text[],
   array['Double machine destoned', 'Zero imported mix', 'Rich fiber & minerals']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000007', 'crop', 'Abakaliki Parboiled Rice (Stone-Free)', 'Grains', 2200, 'kg',
   'Clean long-grain Nigerian rice parboiled and polished in the Ebonyi river basin. Non-sticky, cooks with fluffy separate grains, perfect for fried rice.',
   '1586201375761-83865001e31c', array['1586201375761-83865001e31c']::text[],
   array['By Weight', 'Stone-Free', 'Non-Sticky']::text[],
   array['Destoned and air-blown', 'Sweet natural taste', 'Long firm grain']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Nigerian Honey Beans (Oloyin)', 'Grains', 1900, 'kg',
   'Beloved Nigerian brown honey beans (Ewa Oloyin). Cooks soft and creamy with natural sweetness; carefully sorted, free of stones and pesticide residue.',
   '1551462147-ff29053bfc14', array['1551462147-ff29053bfc14']::text[],
   array['Naturally Sweet', 'Fast Cooking', 'By Weight']::text[],
   array['Naturally sweet flavour', 'Weevil & pesticide free', 'Hand sorted clean']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Sokoto White Cowpea Beans (Iron Beans)', 'Grains', 1750, 'kg',
   'White high-protein cowpeas from northern drylands. Skins slip off easily when soaked, producing light paste for fluffy golden akara and firm moi-moi.',
   '1551462147-ff29053bfc14', array['1551462147-ff29053bfc14']::text[],
   array['High Yield', 'Akara Special']::text[],
   array['Easy hulling', 'High protein yield', 'Triple winnowed']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Shelled Handpicked Egusi (Melon Seeds)', 'Grains', 3400, 'kg',
   'Premium hand-picked and machine-shelled melon seeds with high oil content. Thoroughly cleaned of husks and sand, blending into rich, fragrant Egusi soup.',
   '1508746829417-e6f548d8d6ed', array['1508746829417-e6f548d8d6ed']::text[],
   array['Clean Shelled', 'High Oil Content']::text[],
   array['Zero sand or shells', 'High natural vegetable oil', 'Sun dried clean']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Premium Wild Ogbono Seeds (Apon)', 'Grains', 4500, 'kg',
   'Authentic wild African bush mango seeds (Irvingia gabonensis) from Edo rainforest groves. Legendary draw viscosity and deep nutty richness.',
   '1508746829417-e6f548d8d6ed', array['1508746829417-e6f548d8d6ed']::text[],
   array['Wild Foraged', 'High Draw Power']::text[],
   array['Maximum draw viscosity', 'Wild-harvested', '100% pure bush mango']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000005', 'crop', 'Yellow Sweet Field Maize (Corn Cobs)', 'Grains', 600, 'piece',
   'Plump, milky yellow sweet corn cobs harvested at peak tenderness. Ideal for boiling with coconut, roasting with pear (ube), or making golden ogi/pap.',
   '1551754655-cd27e38d2076', array['1551754655-cd27e38d2076']::text[],
   array['Fresh Picked', 'Per Piece']::text[],
   array['Milky tender kernels', 'Harvested dispatch day', 'Pesticide free']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Crisp White Ijebu Garri', 'Grains', 1200, 'kg',
   'Authentic fermented cassava flakes from Ijebu processors. Famous for its dry crunchy grain and delightful pleasant sourness for eba or drinking cold.',
   '1586201375761-83865001e31c', array['1586201375761-83865001e31c']::text[],
   array['Crispy Sour', 'By Weight']::text[],
   array['Traditional 4-day fermentation', 'Extra dry and crunchy', 'Triple sifted fine']::text[], 'live');

-- --------------------- LIVESTOCK ---------------------
insert into public.products
  (farm_id, kind, name, category, price, unit, description, image, gallery, weight, yield_kg, min_share, status)
values
  ('00000000-0000-4000-8000-000000000005', 'livestock', 'White Fulani (Bunaji) Cow', 'Cow', 540000, 'animal',
   'Lean, muscular pasture-raised northern bull checked by certified veterinarians. Exceptional meat-to-bone ratio with dense cuts and marrow bones.',
   '1570042225831-d98fa7577f1e', array['1570042225831-d98fa7577f1e', '1527153857715-3908f2bae5e8']::text[],
   '300–340kg', 195, 25000, 'live'),

  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Sokoto Gudali Cross Cow', 'Cow', 480000, 'animal',
   'Docile, short-horned Gudali breed raised on natural northern savannas. Highly prized for juicy, tender beef steaks and slow-simmered stews.',
   '1527153857715-3908f2bae5e8', array['1527153857715-3908f2bae5e8', '1570042225831-d98fa7577f1e']::text[],
   '280–310kg', 175, 25000, 'live'),

  ('00000000-0000-4000-8000-000000000003', 'livestock', 'Red Bororo (Rahaji) Bull', 'Cow', 590000, 'animal',
   'Majestic, large-framed red bull with deep savory flavor and gelatinous soup cuts. Popular for large family gatherings and festive shares.',
   '1546445317-29f4545e9d53', array['1546445317-29f4545e9d53', '1570042225831-d98fa7577f1e']::text[],
   '330–370kg', 215, 30000, 'live'),

  ('00000000-0000-4000-8000-000000000003', 'livestock', 'Red Sokoto Meat Goat', 'Goat', 85000, 'animal',
   'The premier meat goat of West Africa. Exceptionally tender, lean, and sweet meat with fine texture, renowned for goat meat pepper soup and asun.',
   '1524024973431-2ad916746881', array['1524024973431-2ad916746881']::text[],
   '32–38kg', 18, 15000, 'live'),

  ('00000000-0000-4000-8000-000000000001', 'livestock', 'West African Dwarf Goat', 'Goat', 65000, 'animal',
   'Pasture-foraged local goat raised in southwestern Nigeria. Deeply flavorful meat, traditionally favored for aromatic pepper soup and Sunday stews.',
   '1568644396922-5c3bfae12521', array['1568644396922-5c3bfae12521']::text[],
   '24–30kg', 13, 15000, 'live'),

  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Giant Balami Pasture Ram', 'Ram', 195000, 'animal',
   'High-pedigree northern Balami ram with clean white coat and broad chest. Tender, succulent meat, veterinary-certified and ideal for celebration feasts.',
   '1484557985045-edf25e08da73', array['1484557985045-edf25e08da73']::text[],
   '55–68kg', 35, 20000, 'live'),

  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Uda Pasture Ram', 'Ram', 160000, 'animal',
   'Tall, hardy, dual-colored Uda ram raised on open ranges. Lean, flavorful meat with excellent yield for communal barbecues and family portion packs.',
   '1484557985045-edf25e08da73', array['1484557985045-edf25e08da73']::text[],
   '46–56kg', 28, 20000, 'live');

-- ----------------------- POOLS -----------------------
insert into public.pools (product_id, name, target, raised, members, closes_at, status)
select id, 'Lagos Island Meat Share 04', price, 455000, 18, now() + interval '14 hours', 'open'
from public.products where name = 'White Fulani (Bunaji) Cow' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at, status)
select id, 'Abuja Central – Asokoro Bulk Group', price, 345000, 12, now() + interval '2 days', 'open'
from public.products where name = 'White Fulani (Bunaji) Cow' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at, status)
select id, 'Lekki Phase 1 Families Cow Pool', price, 480000, 16, now() - interval '1 hour', 'funded'
from public.products where name = 'Sokoto Gudali Cross Cow' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at, status)
select id, 'Surulere Red Sokoto Goat Share', price, 70000, 5, now() + interval '1 day', 'open'
from public.products where name = 'Red Sokoto Meat Goat' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at, status)
select id, 'Ikeja GRA Ram Collective', price, 195000, 9, now() - interval '2 hours', 'funded'
from public.products where name = 'Giant Balami Pasture Ram' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at, status)
select id, 'Bodija Ibadan Goat Meat Share', price, 45000, 3, now() + interval '3 days', 'open'
from public.products where name = 'West African Dwarf Goat' and kind = 'livestock' limit 1;

insert into public.pools (product_id, name, target, raised, members, closes_at, status)
select id, 'Port Harcourt GRA Beef Share', price, 420000, 14, now() + interval '4 days', 'open'
from public.products where name = 'Red Bororo (Rahaji) Bull' and kind = 'livestock' limit 1;
