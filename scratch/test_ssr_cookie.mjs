import fs from 'fs';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

async function test() {
  const supabaseAnon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: loginData } = await supabaseAnon.auth.signInWithPassword({
    email: 'youssef.mohammed3204@gmail.com',
    password: 'AdminPassword2026!',
  });

  const cookieJar = {};
  const ssr = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Object.entries(cookieJar).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          cookieJar[name] = value;
        });
      },
    },
  });

  // Set session into ssr client
  await ssr.auth.setSession({
    access_token: loginData.session.access_token,
    refresh_token: loginData.session.refresh_token,
  });

  console.log('Cookies produced by @supabase/ssr:');
  console.log(cookieJar);

  const cookieHeader = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
  console.log('\nCookie header:', cookieHeader.slice(0, 100) + '...');

  // Test requesting /admin with this cookie header
  const http = await import('http');
  const req = http.get('http://localhost:3005/admin', { headers: { Cookie: cookieHeader } }, (res) => {
    console.log('\nResponse status from /admin:', res.statusCode);
    console.log('Location:', res.headers['location']);
  });
}

test().catch(console.error);
