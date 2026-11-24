import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const content = fs.readFileSync('./src/environments/environment.ts', 'utf-8');
const url = content.match(/supabaseUrl:\s*"([^"]+)"/)[1];
const key = content.match(/supabaseAnonKey:\s*"([^"]+)"/)[1];
const client = createClient(url, key);

async function test() {
  const [f, p, o, prof] = await Promise.all([
    client.from('farms').select('id, name, owner_id'),
    client.from('products').select('id, name'),
    client.from('orders').select('id'),
    client.from('profiles').select('id, role, full_name')
  ]);
  console.log('Farms count:', f.data?.length, f.error?.message);
  console.log('Farms data:', f.data);
  console.log('Products count:', p.data?.length, p.error?.message);
  console.log('Orders count:', o.data?.length, o.error?.message);
  console.log('Profiles count:', prof.data?.length, prof.error?.message);
}
test();
