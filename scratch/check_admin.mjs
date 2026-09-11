import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

try {
  const envText = fs.readFileSync('.env.local', 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch (e) {}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const { data: admins } = await supabaseAdmin.from('admins').select('*');
  console.log('Admins:', admins);
  if (admins && admins.length > 0) {
    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(admins[0].user_id);
    console.log('Admin user details:', userData?.user?.email, 'confirmed_at:', userData?.user?.email_confirmed_at);
  }
}

checkUser().catch(console.error);
