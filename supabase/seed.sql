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
   '/images/tomatoes.jpg', array['/images/tomatoes.jpg', '/images/tomatoes2.jpg']::text[],
   array['By Weight', 'Basket Available', 'Stew Essential']::text[],
   array['Pesticide-free', 'Harvested Thursday to order', 'Sorted by hand into crates']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Fresh Ugu Leaves (Fluted Pumpkin)', 'Vegetables', 600, 'bunch',
   'Crisp, deep-green fluted pumpkin leaves (Telfairia occidentalis) harvested at dawn. Nutrient-dense, essential for Egusi, Edikang Ikong, and Ogbono soups.',
   '/images/ugu.jpg', array['/images/ugu.jpg', '/images/ugu2.jpg']::text[],
   array['Fresh Cut', 'Soup Staple']::text[],
   array['Cut fresh at dawn', 'Clean borehole irrigation', 'Pesticide free']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Fresh Ewedu Leaves (Jute Mallow)', 'Vegetables', 450, 'bunch',
   'Young, tender jute leaves harvested on dispatch morning. High natural mucilage that cooks into vibrant green, slippery draw soup for hot amala.',
   '/images/ewedu.jpg', array['/images/ewedu.jpg']::text[],
   array['Fresh Cut', 'High Draw']::text[],
   array['Harvested same morning', 'Young tender tips', 'Rich natural draw']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Efo Shoko (Lagos Green Spinach)', 'Vegetables', 500, 'bunch',
   'Broad, crisp Lagos greens (Celosia argentea). Retains deep green chlorophyll and bite during cooking for authentic Yoruba Efo Riro.',
   '/images/shoko.jpg', array['/images/shoko.jpg']::text[],
   array['Fresh Cut', 'Efo Riro Special']::text[],
   array['Borehole watered', 'Cut same morning', 'Dirt & sand washed']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Fresh Ata Rodo (Scotch Bonnet)', 'Vegetables', 1600, 'kg',
   'Fiery, fragrant yellow and red Nigerian scotch bonnet peppers. Grown from heirloom northern seeds for authentic peppery heat and floral aroma.',
   '/images/rodo.jpg', array['/images/rodo.jpg']::text[],
   array['Extra Hot', 'By Weight', 'Aromatic']::text[],
   array['Heirloom seeds', 'Intense aroma and heat', 'Hand-sorted pods']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Sweet Tatashe (Red Bell Pepper)', 'Vegetables', 1800, 'kg',
   'Thick-walled, deep-crimson sweet tatashe peppers from the cool Jos hills. Imparts rich red pigment and mild sweetness to pepper blends.',
   '/images/tatashe.jpg', array['/images/tatashe.jpg']::text[],
   array['By Weight', 'Jollof Color']::text[],
   array['Naturally sweetened', 'Thick juicy walls', 'Grade A sorting']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Red Shombo Chili Peppers', 'Vegetables', 1100, 'kg',
   'Long cayenne chili peppers with rich scarlet pigment and sharp spice. Great for balancing heat and colour in pepper soups and suya marinades.',
   '/images/shombo.jpg', array['/images/shombo.jpg']::text[],
   array['Extra Hot', 'By Weight']::text[],
   array['Pure heirloom seed', 'Hand-picked', 'Zero colour additives']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000009', 'crop', 'Fresh Tender Okra (Ila / Okwuru)', 'Vegetables', 950, 'kg',
   'Young, snappy green ladyfinger okra pods harvested daily. Highly tender with excellent draw, delicious in seafood okra or ila alasepo.',
   '/images/okra.jpg', array['/images/okra.jpg']::text[],
   array['By Weight', 'High Draw']::text[],
   array['Daily fresh harvest', 'Snappy tender tips', 'No woody pods']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000008', 'crop', 'Washed Bitterleaf (Onugbu)', 'Vegetables', 750, 'bunch',
   'Traditionally washed and squeeze-drained fresh bitterleaf. Balanced mild bitterness preserved for authentic Ofe Onugbu and herbal soups.',
   '/images/bitterleaf.jpg', array['/images/bitterleaf.jpg']::text[],
   array['Ready to Cook', 'Debittered']::text[],
   array['Traditionally washed', 'Ready to cook', 'Retains herbal aroma']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Crunchy Jos Carrots & Cabbage', 'Vegetables', 850, 'kg',
   'Sweet, crunchy carrots and dense heads of green cabbage grown in the cool mountain climate of Plateau. Clean-washed and packed crisp.',
   '/images/carrots.jpg', array['/images/carrots.jpg']::text[],
   array['By Weight', 'Direct Farm']::text[],
   array['Clean washed', 'No synthetic pesticides', 'Crisp fresh tops']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000008', 'crop', 'Green Garden Egg (Anara) Basket', 'Vegetables', 1200, 'basket',
   'Fresh, crunchy ivory and green garden eggs. Enjoy fresh with groundnut paste (ose oji) or simmered into rich garden egg sauce with boiled yam.',
   '/images/gardenegg.jpg', array['/images/gardenegg.jpg']::text[],
   array['Traditional', 'By Basket']::text[],
   array['Hand-sorted', 'Crunchy & firm', 'Great fiber source']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Weekly Nigerian Soup Basket', 'Vegetables', 14500, 'box',
   'A complete Nigerian family week pack: 5kg plum tomatoes, 2kg tatashe, 1kg rodo, 3 bunches ugu leaves, 2 bunches ewedu, carrots and sweet potatoes.',
   '/images/vegmarket.jpg', array['/images/vegmarket.jpg', '/images/ugu.jpg']::text[],
   array['Family Pack', 'Mixed Box']::text[],
   array['Feeds a family of 5 for a week', 'Save 15% vs single items', 'Harvested Thursday']::text[], 'live'),

  -- Fruits
  ('00000000-0000-4000-8000-000000000004', 'crop', 'Sweet Benue Mangoes (Peter & Julie)', 'Fruits', 1500, 'kg',
   'Rich, golden, fiberless sweet mangoes tree-ripened in Benue orchards. Guaranteed zero calcium carbide — pure, intense tropical fruit nectar.',
   '/images/mango.jpg', array['/images/mango.jpg']::text[],
   array['In Season', 'Tree Ripened', 'Carbide Free']::text[],
   array['Zero calcium carbide', 'Tree ripened', 'Fresh 48h harvest']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Ripe Sweet Plantains (Dodo Bunches)', 'Fruits', 2200, 'bunch',
   'Plump, naturally ripened sweet plantains from Edo rainforest plantations. Golden pulp with spots of sugar ripening for sweet fried dodo or bole.',
   '/images/plantain.jpg', array['/images/plantain.jpg']::text[],
   array['Sweet Dodo', 'Tree Ripened']::text[],
   array['Naturally tree ripened', 'No chemical accelerators', 'Heavy meaty fingers']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Green Unripe Cooking Plantains', 'Fruits', 1900, 'bunch',
   'Firm green plantains loaded with resistant starch and minerals. Prized for diabetic-friendly boiled plantain, goat meat plantain pepper soup (ukodo), or flour.',
   '/images/greenplantain.jpg', array['/images/greenplantain.jpg']::text[],
   array['Resistant Starch', 'Plantain Porridge']::text[],
   array['Firm green harvest', 'Cut Thursday before shipping', 'Zero bruises']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Sugarloaf Honey Pineapple', 'Fruits', 1300, 'piece',
   'Low-acid, sweet sugarloaf pineapple packed right after cutting. Golden yellow flesh with soft edible core and intense natural sweetness.',
   '/images/pineapple.jpg', array['/images/pineapple.jpg']::text[],
   array['Per Piece', 'Sweet']::text[],
   array['Naturally golden', 'High brix sweetness', 'Low stomach acidity']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Northern Sweet Red Watermelon', 'Fruits', 2200, 'piece',
   'Crisp, deep-red watermelons harvested from Kano riverbanks. Averaging 6 to 8kg, juicy and sweet with zero sugar injections or dye tampering.',
   '/images/watermelon.jpg', array['/images/watermelon.jpg']::text[],
   array['Per Piece', '6–8kg']::text[],
   array['No sugar injections', 'Field ripened', 'Crisp sweet flesh']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Sweet Gboko Oranges (Benue Valencia)', 'Fruits', 1400, 'basket',
   'Thin-skinned, highly juicy sweet oranges from Gboko orchards in Benue State. Renowned across Nigeria for their bursting natural sugar content.',
   '/images/oranges.jpg', array['/images/oranges.jpg']::text[],
   array['Juicy', 'By Basket']::text[],
   array['High juice yield', 'Thin skin', 'Naturally sweet']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000009', 'crop', 'African Star Apple (Agbalumo / Udara)', 'Fruits', 1800, 'basket',
   'Wild-foraged sweet-and-tangy agbalumo (Chrysophyllum albidum). Plump orange skin with sweet milky nectar and chewy seeds.',
   '/images/agbalumo.jpg', array['/images/agbalumo.jpg']::text[],
   array['Seasonal', 'By Basket']::text[],
   array['Wild-grove harvest', 'Naturally sweet pulp', 'Rich in Vitamin C']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000009', 'crop', 'Sweet Golden Papaya (Solo Pawpaw)', 'Fruits', 1100, 'piece',
   'Tree-ripened solo golden papaya with deep salmon-pink flesh. Fragrant, sweet, rich in papain enzymes for healthy digestion with zero chemical forcing.',
   '/images/pawpaw.jpg', array['/images/pawpaw.jpg']::text[],
   array['Tree Ripened', 'Per Piece']::text[],
   array['Naturally tree ripened', 'Rich papain enzymes', 'Low acidity']::text[], 'live'),

  -- Tubers
  ('00000000-0000-4000-8000-000000000004', 'crop', 'Benue White Pona Yam (New Harvest)', 'Tubers', 2800, 'tuber',
   'Genuine White Pona yam tubers from Benue State. Dry, floury, and starch-rich — pounds effortlessly into lump-free, stretchy pounded yam (iyan) or boiled yam.',
   '/images/yam.jpg', array['/images/yam.jpg', '/images/yam2.jpg']::text[],
   array['Pounded Yam Special', 'Dry & Floury', 'Per Tuber']::text[],
   array['Food Basket of the Nation', 'Floury texture', 'Zero hollow centres']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Jos Highland Irish Potatoes', 'Tubers', 950, 'kg',
   'Firm Irish potatoes harvested from volcanic soils of the Jos plateau. Clean, uniform skin with high starch content, perfect for chips, boiling, or potato porridge.',
   '/images/irishpotato.jpg', array['/images/irishpotato.jpg']::text[],
   array['By Weight', 'Highland Grown']::text[],
   array['Dug weekly', 'No sprout inhibitors', 'Uniform medium-large sizes']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Plateau Orange Sweet Potatoes', 'Tubers', 750, 'kg',
   'Naturally sweet, moist orange-fleshed sweet potatoes loaded with beta-carotene. Delicious boiled, roasted, or fried as sweet chips.',
   '/images/sweetpotato.jpg', array['/images/sweetpotato.jpg']::text[],
   array['By Weight', 'Vitamin A']::text[],
   array['Naturally sweet', 'Dirt washed', 'Rich beta-carotene']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Fresh Cassava Tubers (Sweet Variety)', 'Tubers', 500, 'tuber',
   'Heavy, freshly dug sweet white cassava roots harvested specifically for your order. Perfect for fresh fufu, abacha shredding, or home starch processing.',
   '/images/cassava.jpg', array['/images/cassava.jpg']::text[],
   array['Fresh Dug', 'Per Tuber']::text[],
   array['Freshly harvested order day', 'Low-cyanide sweet cultivar', 'Firm white flesh']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000008', 'crop', 'Floury Cocoyam Tubers (Ede Ofe)', 'Tubers', 850, 'kg',
   'Starch-rich red and white cocoyam tubers (Colocasia esculenta). The premier authentic thickener for traditional Ofe Oha and Bitterleaf soup.',
   '/images/cocoyam.jpg', array['/images/cocoyam.jpg']::text[],
   array['Soup Thickener', 'By Weight']::text[],
   array['High starch content', 'Perfect soup thickener', 'Firm healthy corms']::text[], 'live'),

  -- Grains & Legumes
  ('00000000-0000-4000-8000-000000000001', 'crop', 'Local Ofada Rice (Double Destoned)', 'Grains', 2600, 'kg',
   'Traditional short-grain unpolished Ofada rice from Ogun millers. Machine-destoned twice to guarantee 100% stone-free grains with legendary nutty aroma.',
   '/images/ofada.jpg', array['/images/ofada.jpg']::text[],
   array['Stone-Free', 'Unpolished', 'Authentic Aroma']::text[],
   array['Double machine destoned', 'Zero imported mix', 'Rich fiber & minerals']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000007', 'crop', 'Abakaliki Parboiled Rice (Stone-Free)', 'Grains', 2200, 'kg',
   'Clean long-grain Nigerian rice parboiled and polished in the Ebonyi river basin. Non-sticky, cooks with fluffy separate grains, perfect for fried rice.',
   '/images/rice.jpg', array['/images/rice.jpg']::text[],
   array['By Weight', 'Stone-Free', 'Non-Sticky']::text[],
   array['Destoned and air-blown', 'Sweet natural taste', 'Long firm grain']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Nigerian Honey Beans (Oloyin)', 'Grains', 1900, 'kg',
   'Beloved Nigerian brown honey beans (Ewa Oloyin). Cooks soft and creamy with natural sweetness; carefully sorted, free of stones and pesticide residue.',
   '/images/beans.jpg', array['/images/beans.jpg']::text[],
   array['Naturally Sweet', 'Fast Cooking', 'By Weight']::text[],
   array['Naturally sweet flavour', 'Weevil & pesticide free', 'Hand sorted clean']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Sokoto White Cowpea Beans (Iron Beans)', 'Grains', 1750, 'kg',
   'White high-protein cowpeas from northern drylands. Skins slip off easily when soaked, producing light paste for fluffy golden akara and firm moi-moi.',
   '/images/cowpea.jpg', array['/images/cowpea.jpg']::text[],
   array['High Yield', 'Akara Special']::text[],
   array['Easy hulling', 'High protein yield', 'Triple winnowed']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Shelled Handpicked Egusi (Melon Seeds)', 'Grains', 3400, 'kg',
   'Premium hand-picked and machine-shelled melon seeds with high oil content. Thoroughly cleaned of husks and sand, blending into rich, fragrant Egusi soup.',
   '/images/egusi.jpg', array['/images/egusi.jpg']::text[],
   array['Clean Shelled', 'High Oil Content']::text[],
   array['Zero sand or shells', 'High natural vegetable oil', 'Sun dried clean']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Premium Wild Ogbono Seeds (Apon)', 'Grains', 4500, 'kg',
   'Authentic wild African bush mango seeds (Irvingia gabonensis) from Edo rainforest groves. Legendary draw viscosity and deep nutty richness.',
   '/images/ogbono.jpg', array['/images/ogbono.jpg']::text[],
   array['Wild Foraged', 'High Draw Power']::text[],
   array['Maximum draw viscosity', 'Wild-harvested', '100% pure bush mango']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000005', 'crop', 'Yellow Sweet Field Maize (Corn Cobs)', 'Grains', 600, 'piece',
   'Plump, milky yellow sweet corn cobs harvested at peak tenderness. Ideal for boiling with coconut, roasting with pear (ube), or making golden ogi/pap.',
   '/images/maize.jpg', array['/images/maize.jpg']::text[],
   array['Fresh Picked', 'Per Piece']::text[],
   array['Milky tender kernels', 'Harvested dispatch day', 'Pesticide free']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Crisp White Ijebu Garri', 'Grains', 1200, 'kg',
   'Authentic fermented cassava flakes from Ijebu processors. Famous for its dry crunchy grain and delightful pleasant sourness for eba or drinking cold.',
   '/images/garri.jpg', array['/images/garri.jpg']::text[],
   array['Crispy Sour', 'By Weight']::text[],
   array['Traditional 4-day fermentation', 'Extra dry and crunchy', 'Triple sifted fine']::text[], 'live'),

  -- New Vegetables & Herbs
  ('00000000-0000-4000-8000-000000000006', 'crop', 'Fresh Scent Leaves (Efirin / Nchanwu)', 'Vegetables', 500, 'bunch',
   'Pungent, highly aromatic African basil leaves (Ocimum gratissimum) freshly cut at dawn. Essential for authentic goat meat pepper soup, black soup, and traditional digestive remedies.',
   '/images/scentleaf.jpg', array['/images/scentleaf.jpg']::text[],
   array['Herbal Aroma', 'Fresh Cut', 'Pepper Soup Staple']::text[],
   array['Dawn cut harvest', 'Clean borehole rinsed', 'Potent fragrant essential oils']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Fresh Waterleaf (Gbure / Mgbolodi)', 'Vegetables', 400, 'bunch',
   'Succulent, tender waterleaf (Talinum triangulare) harvested before sunlight warms the leaves. Crisp and mild, the non-negotiable partner to okazi/afang in authentic Calabar Edikang Ikong.',
   '/images/waterleaf.jpg', array['/images/waterleaf.jpg']::text[],
   array['Fresh Cut', 'Afang Essential', 'Tender Tips']::text[],
   array['Morning hand-harvest', 'Cleanly sorted', 'Retains crisp crunch']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Fresh Green Amaranth (Efo Tete)', 'Vegetables', 450, 'bunch',
   'Tender indigenous Nigerian green amaranth greens. Naturally sweet with delicate stalks that cook down rapidly into velvety Yoruba stews and egusi.',
   '/images/amaranth.jpg', array['/images/amaranth.jpg']::text[],
   array['Fresh Cut', 'Traditional Soup', 'Iron Rich']::text[],
   array['Farm gate freshness', 'Zero chemical sprays', 'Tender soft stalks']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000008', 'crop', 'Aromatic Yellow Nsukka Pepper (Ose Nsukka)', 'Vegetables', 2200, 'kg',
   'Famous yellow Scotch bonnet variety from the red hills of Nsukka. Renowned for its explosive floral perfume, intoxicating fruity bouquet, and sharp persistent heat.',
   '/images/nsukkapepper.jpg', array['/images/nsukkapepper.jpg']::text[],
   array['Extra Hot', 'By Weight', 'Nsukka Fragrant']::text[],
   array['Authentic Nsukka heirloom', 'Distinct fruity perfume', 'Hand sorted pod by pod']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Sun-Cured Kano Red Onions (Alubosa)', 'Vegetables', 1400, 'kg',
   'Tight, dry-skin crimson northern Nigerian red onions. Heavy bulbs cured in dry Sahel air with strong sulfur aroma and high dry matter, ensuring 3-month pantry shelf life.',
   '/images/onions.jpg', array['/images/onions.jpg']::text[],
   array['Long Shelf Life', 'By Weight', 'Northern Cured']::text[],
   array['Sun-cured 2 weeks', 'Firm solid concentric layers', 'Zero rot or soft necks']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Crisp Jos Highland Cucumbers', 'Vegetables', 800, 'kg',
   'Straight, dark-green cucumbers grown in the cool highland soils of Jos. Extra crisp, highly refreshing with tiny seed cavities, thin tender skin, and sweet juicy bite.',
   '/images/cucumber.jpg', array['/images/cucumber.jpg']::text[],
   array['By Weight', 'Highland Crisp', 'Salad & Juicing']::text[],
   array['Cool climate crispness', 'Thin edible skin', 'Picked firm and chilled']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000005', 'crop', 'Kaduna Golden Ginger Rhizomes (Chitta)', 'Vegetables', 1800, 'kg',
   'Southern Kaduna ginger known internationally for having the highest gingerol essential oil concentration. Incredibly spicy, fragrant, and clean-washed for cooking and ginger drinks.',
   '/images/ginger.jpg', array['/images/ginger.jpg']::text[],
   array['By Weight', 'High Pungency', 'Immunity Boost']::text[],
   array['Washed clean of soil', 'Maximum gingerol potency', 'Firm plump fingers']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Fresh Uziza Leaves (Piper Guineense)', 'Vegetables', 650, 'bunch',
   'Glossy green West African black pepper leaves. Gives a warm, peppery, slightly camphoric kick to white soups (Ofe Sala), fisherman soup, and yam pepper soup.',
   '/images/uziza.jpg', array['/images/uziza.jpg']::text[],
   array['Peppery Aroma', 'Fresh Cut', 'Delta Special']::text[],
   array['Cut fresh morning of dispatch', 'Organic shade grown', 'Strong essential oil scent']::text[], 'live'),

  -- New Fruits
  ('00000000-0000-4000-8000-000000000008', 'crop', 'Native African Bush Pears (Ube)', 'Fruits', 1700, 'kg',
   'Deep indigo-violet African pears (Dacryodes edulis) with rich, velvety greenish butter flesh. Gently soften in hot water or warm embers and pair with freshly roasted corn.',
   '/images/ube.jpg', array['/images/ube.jpg']::text[],
   array['Traditional Pair', 'In Season', 'Butter Rich']::text[],
   array['Velvety butter pulp when warmed', 'Carefully crate-packed', 'Zero bruised skins']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Sweet Golden Bananas (Cavendish / Ogede Wewe)', 'Fruits', 1600, 'bunch',
   'Naturally yellowed, honey-sweet dessert bananas from rainforest orchards. Never gassed with chemical calcium carbide; wholesome nutrition packed with potassium.',
   '/images/banana.jpg', array['/images/banana.jpg']::text[],
   array['Tree Ripened', 'Snack Staple', 'Carbide Free']::text[],
   array['100% naturally yellowed', 'High natural sweetness', 'Plump clean unblemished fingers']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Jos Butter Avocados (Plateau Green Pear)', 'Fruits', 2100, 'kg',
   'Silky, nut-rich avocados grown at high altitude in Plateau state. Small seed core, thick buttery meat with zero watery texture or dark strings. Heavenly on warm sourdough or salad.',
   '/images/avocado.jpg', array['/images/avocado.jpg']::text[],
   array['Healthy Fats', 'Highland Grown', 'Creamy Flesh']::text[],
   array['Grade A large size', 'Zero fibrous stringiness', 'Slow mountain tree-ripened']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000009', 'crop', 'Fresh Fragrant Soursop (Shawashawa)', 'Fruits', 2400, 'kg',
   'Spiky emerald green soursop (Annona muricata) with cotton-soft white pulp. Exquisitely aromatic with sweet-tart notes of pineapple and strawberry; prized for cleansing juices.',
   '/images/soursop.jpg', array['/images/soursop.jpg']::text[],
   array['Superfood', 'Juice Special', 'Antioxidant Rich']::text[],
   array['Hand-picked at tender firmness', 'Intense tropical citrus-custard flavor', 'Padded transport packaging']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000001', 'crop', 'Badagry Dwarf Sweet Coconuts (Agbon)', 'Fruits', 900, 'piece',
   'Heavy coastal coconuts bursting with natural electrolyte-rich coconut water and thick, nutty, crisp white copra meat. Perfect for coconut rice, candies, or fresh eating.',
   '/images/coconut.jpg', array['/images/coconut.jpg']::text[],
   array['Hydration', 'Fresh Meat', 'Coastal Harvest']::text[],
   array['Heavy with fresh water', 'Thick creamy white meat', 'Cleanly husked shell']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Fresh Citrus Basket (Gboko Limes & Lemons)', 'Fruits', 1500, 'basket',
   'Handful basket of sun-drenched green limes and fragrant yellow lemons from Gboko citrus orchards. Paper-thin rinds yielding maximum tart, fragrant vitamin-C rich juice.',
   '/images/citrus.jpg', array['/images/citrus.jpg']::text[],
   array['High Juice Yield', 'Citrus Basket', 'Vitamin C']::text[],
   array['Thin skin maximum juice', 'Zero synthetic rind wax', 'Picked fresh daily']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000009', 'crop', 'Crisp Red Cashew Apples (Ogbomoso Heritage)', 'Fruits', 1300, 'basket',
   'Vibrant red-orange cashew apples harvested at peak ripeness with intact nut. Loaded with sweet, astringent, intensely fragrant juice with 5 times the vitamin C of oranges.',
   '/images/cashew.jpg', array['/images/cashew.jpg']::text[],
   array['In Season', 'Juicy Nectar', 'Traditional']::text[],
   array['Harvested same-day dawn', 'Exploding sweet nectar', 'Carefully cushioned']::text[], 'live'),

  -- New Tubers
  ('00000000-0000-4000-8000-000000000001', 'crop', 'Water Yam (Ji Abana / Ewura)', 'Tubers', 2600, 'tuber',
   'Large, moisture-rich water yam tuber (Dioscorea alata). High in natural starch; non-negotiable for grating into golden crispy Ojojo fritters or rich Ijebu Ikokore pottage.',
   '/images/wateryam.jpg', array['/images/wateryam.jpg']::text[],
   array['Ikokore Staple', 'Ojojo Special', 'By Tuber']::text[],
   array['Firm healthy tuber body', 'Triple-tested for Ikokore draw', 'Stored in dry aerated barn']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Yellow Yam (Ji Oku / Guinea Yellow Yam)', 'Tubers', 3100, 'tuber',
   'Hearty yellow yam (Dioscorea cayenensis) with dense, dry, golden interior. Rich in provitamin A carotenoids, sweet nutty aroma, and cooks to a firm, satisfying dry bite.',
   '/images/yam2.jpg', array['/images/yam2.jpg', '/images/yam.jpg']::text[],
   array['Firm Texture', 'Carotenoid Rich', 'Benue Harvest']::text[],
   array['Benue food basket harvest', 'Dense non-watery crumb', 'Sun-cured bark zero blemishes']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Highland Red Ruby Beetroots', 'Tubers', 1100, 'kg',
   'Dense, earth-sweet ruby beetroots grown in volcanic mountain soil in Jos. Deep purple interior rich in nitrates, folic acid, and natural betalain pigments for vitality.',
   '/images/beetroot.jpg', array['/images/beetroot.jpg']::text[],
   array['By Weight', 'Highland Fresh', 'Detox & Juicing']::text[],
   array['Unbroken firm skins', 'Extra deep blood-red juice', 'Grown in cool highland loam']::text[], 'live'),

  -- New Grains, Legumes & Farm Staples
  ('00000000-0000-4000-8000-000000000003', 'crop', 'Potiskum Northern Brown Beans (Drum Beans)', 'Grains', 2100, 'kg',
   'Plump, large-seeded brown cowpeas prized across Lagos food spots. Cooks into meltingly soft, mashable texture with natural bean sweetness; the definitive choice for Ewa Aganyin.',
   '/images/beans2.jpg', array['/images/beans2.jpg', '/images/beans.jpg']::text[],
   array['Ewa Aganyin Special', 'By Weight', 'Weevil Free']::text[],
   array['Double swelling ratio', 'Natural chili-pod stored (no pesticide powder)', 'Machine sorted clean']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000007', 'crop', 'Artisanal Red Palm Oil Garri (Yellow Garri)', 'Grains', 1400, 'kg',
   'Sun-dried fermented cassava mash roasted over wood fire with pure unadulterated palm oil. Fine, dry golden grains that mold into supple, aromatic yellow eba for traditional soups.',
   '/images/yellowgarri.jpg', array['/images/yellowgarri.jpg']::text[],
   array['Palm Oil Fried', 'Eastern Style', 'Extra Crispy']::text[],
   array['Infused with virgin palm oil', 'Double sifted silky grain', 'Zero sandy residue guarantee']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Red Guinea Corn / Sorghum (Dawa)', 'Grains', 1300, 'kg',
   'Ruby-colored ancient sorghum grains harvested from northern drylands. 100% gluten-free, dense in polyphenols and iron; prime ingredient for brewing red kunu and weaning cereals.',
   '/images/sorghum.jpg', array['/images/sorghum.jpg']::text[],
   array['Ancient Grain', 'Gluten Free', 'Tom Brown Staple']::text[],
   array['Air winnowed three times', 'Heirloom dryland seed', 'Rich in iron and magnesium']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000002', 'crop', 'Plateau Acha (White Fonio / Hungry Rice)', 'Grains', 2800, 'kg',
   'One of Africa''s oldest cultivated cereals, grown in the rocky soils of Plateau. Delicate micro-grains with nutty flavor, low glycemic index, and essential sulfur-bearing amino acids.',
   '/images/acha.jpg', array['/images/acha.jpg']::text[],
   array['Diabetic Friendly', 'Superfood', 'Ancient Grain']::text[],
   array['Meticulously sand-washed and destoned', 'Cooks in 3-5 minutes', 'Naturally gluten-free']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000003', 'crop', 'Raw Kano Golden Groundnuts (Shelled Peanuts)', 'Grains', 1600, 'kg',
   'Sweet, crunchy red-skin groundnuts grown in arid sandy Kano soils. High natural oil content, sweet nutty taste; wonderful for roasting with garri or grinding into silky peanut paste.',
   '/images/groundnut.jpg', array['/images/groundnut.jpg']::text[],
   array['High Protein', 'By Weight', 'Sweet Red Skin']::text[],
   array['Aflatoxin inspected', 'Sun dried extra crunchy', 'Uniform plump kernels']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Natural Benne Seeds (White Sesame Seeds)', 'Grains', 2300, 'kg',
   'Pearlescent white sesame seeds harvested from the Benue river plains. Loaded with calcium, healthy polyunsaturated oils, and nutty scent for beniseed soup, baking, and snacks.',
   '/images/sesame.jpg', array['/images/sesame.jpg']::text[],
   array['Superseed', 'Calcium Rich', 'Export Grade']::text[],
   array['99.8% cleaned purity', 'Cold-press ready oil content', 'Chemical-free processing']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000009', 'crop', 'Artisanal Fermented Locust Beans (Iru Woro)', 'Grains', 1200, 'pack',
   'Whole-bean African locust beans fermented traditionally inside wrapped banana leaves. Delivers deep, pungent savory umami complexity to efo riro, ila alasepo, and traditional stews.',
   '/images/iru.jpg', array['/images/iru.jpg']::text[],
   array['Umami Seasoning', 'Natural Ferment', 'Traditional']::text[],
   array['Traditional earthen pot fermentation', 'Zero artificial flavor enhancers', 'Packaged fresh in leaves']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000006', 'crop', 'Pure Unadulterated Red Palm Oil (Banga Virgin Oil)', 'Grains', 2500, 'bottle',
   'Rich, deep-red, slow-settled virgin palm oil extracted from fresh ripe oil palm fruit clusters. Completely unadulterated with dye or kerosene; thick, fragrant, and heavily beta-carotene rich.',
   '/images/palmoil.jpg', array['/images/palmoil.jpg']::text[],
   array['First Press', 'Zero Colorants', 'Banga Stew']::text[],
   array['Single-estate rainforest grove', 'Naturally settles clear (no adulterants)', 'Sealed tamper-proof 1L glass bottle']::text[], 'live'),

  ('00000000-0000-4000-8000-000000000004', 'crop', 'Raw Wildflower Forest Honey', 'Grains', 3800, 'bottle',
   '100% pure, unheated, unpasteurized amber honey harvested by local beekeepers in the woodlands of Benue. Packed with active bee pollen, live enzymes, and rich floral notes.',
   '/images/honey.jpg', array['/images/honey.jpg']::text[],
   array['100% Raw Honey', 'Wild Harvest', 'Sugar Free']::text[],
   array['Completely raw and unpasteurized', 'Zero sugar or syrup adulteration', '750ml sealed glass jar']::text[], 'live');

-- --------------------- LIVESTOCK ---------------------
insert into public.products
  (farm_id, kind, name, category, price, unit, description, image, gallery, weight, yield_kg, min_share, status)
values
  ('00000000-0000-4000-8000-000000000005', 'livestock', 'White Fulani (Bunaji) Cow', 'Cow', 540000, 'animal',
   'Lean, muscular pasture-raised northern bull checked by certified veterinarians. Exceptional meat-to-bone ratio with dense cuts and marrow bones.',
   '/images/whitefulani.jpg', array['/images/whitefulani.jpg']::text[],
   '300–340kg', 195, 25000, 'live'),

  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Sokoto Gudali Cross Cow', 'Cow', 480000, 'animal',
   'Docile, short-horned Gudali breed raised on natural northern savannas. Highly prized for juicy, tender beef steaks and slow-simmered stews.',
   '/images/gudali.jpg', array['/images/gudali.jpg']::text[],
   '280–310kg', 175, 25000, 'live'),

  ('00000000-0000-4000-8000-000000000003', 'livestock', 'Red Bororo (Rahaji) Bull', 'Cow', 590000, 'animal',
   'Majestic, large-framed red bull with deep savory flavor and gelatinous soup cuts. Popular for large family gatherings and festive shares.',
   '/images/redbororo.jpg', array['/images/redbororo.jpg']::text[],
   '330–370kg', 215, 30000, 'live'),

  ('00000000-0000-4000-8000-000000000003', 'livestock', 'Red Sokoto Meat Goat', 'Goat', 85000, 'animal',
   'The premier meat goat of West Africa. Exceptionally tender, lean, and sweet meat with fine texture, renowned for goat meat pepper soup and asun.',
   '/images/redsokoto.jpg', array['/images/redsokoto.jpg']::text[],
   '32–38kg', 18, 15000, 'live'),

  ('00000000-0000-4000-8000-000000000001', 'livestock', 'West African Dwarf Goat', 'Goat', 65000, 'animal',
   'Pasture-foraged local goat raised in southwestern Nigeria. Deeply flavorful meat, traditionally favored for aromatic pepper soup and Sunday stews.',
   '/images/dwarfgoat.jpg', array['/images/dwarfgoat.jpg']::text[],
   '24–30kg', 13, 15000, 'live'),

  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Giant Balami Pasture Ram', 'Ram', 195000, 'animal',
   'High-pedigree northern Balami ram with clean white coat and broad chest. Tender, succulent meat, veterinary-certified and ideal for celebration feasts.',
   '/images/balami.jpg', array['/images/balami.jpg']::text[],
   '55–68kg', 35, 20000, 'live'),

  ('00000000-0000-4000-8000-000000000005', 'livestock', 'Uda Pasture Ram', 'Ram', 160000, 'animal',
   'Tall, hardy, dual-colored Uda ram raised on open ranges. Lean, flavorful meat with excellent yield for communal barbecues and family portion packs.',
   '/images/uda.jpg', array['/images/uda.jpg']::text[],
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
