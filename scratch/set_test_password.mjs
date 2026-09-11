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

async function setTestPassword() {
  const { data: admins } = await supabaseAdmin.from('admins').select('*');
  const adminId = admins[0].user_id;
  const { error } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
    password: 'AdminPassword2026!',
  });
  console.log('Set admin password result:', error ? error.message : 'SUCCESS');
}

setTestPassword().catch(console.error);
