const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zwbspstsbpzsnphdohko.supabase.co',
  'sb_publishable_IBx9PYkqJPg77OZmISs_Rg_NWDtJDLw'
);

async function check() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, password');

  if (error) {
    console.log('Error:', error.message);
    return;
  }
  console.log('Users found:', data.length);
  data.forEach(u => {
    console.log(`  ID: ${u.id}`);
    console.log(`  Email: "${u.email}"`);
    console.log(`  Name: ${u.name}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Password hash: ${u.password}`);
    console.log('---');
  });
}

check();
