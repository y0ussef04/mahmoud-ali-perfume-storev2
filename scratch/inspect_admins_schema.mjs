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

async function inspect() {
  const { data: admins, error } = await supabaseAdmin.from('admins').select('*');
  console.log('Admins data:', admins, error);

  // Check RPC or table info if possible
  const { data: users, error: uErr } = await supabaseAdmin.auth.admin.listUsers();
  console.log('Auth users count:', users?.users?.length, uErr);
  if (users?.users) {
    for (const u of users.users) {
      console.log('User:', u.id, u.email, u.created_at);
    }
  }
}

inspect().catch(console.error);
