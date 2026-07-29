const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://zwbspstsbpzsnphdohko.supabase.co',
  'sb_publishable_IBx9PYkqJPg77OZmISs_Rg_NWDtJDLw'
);

async function setup() {
  console.log('Testing connection...');
  const test = await sb.from('users').select('id').limit(1);
  console.log('Connection:', test.error ? test.error.message : 'OK');

  // Try using the REST API to create tables via supabase-js
  // We need to use the SQL editor or API
  console.log('\nNote: Tables must be created via Supabase Dashboard SQL Editor');
  console.log('Please run the SQL below in https://supabase.com/dashboard → SQL Editor');
  console.log('========================================');
}

setup();
