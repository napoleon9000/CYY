require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

console.log('🔄 Testing Supabase connection...');
console.log(`📍 URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Successfully connected to Supabase!');
    
    // Test auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ Current user:', user.email);
    } else {
      console.log('ℹ️  No authenticated user (anonymous mode)');
    }

    // List tables
    const { data: tables } = await supabase.rpc('get_tables_list', {});
    if (tables) {
      console.log('\n📊 Available tables:');
      tables.forEach(table => console.log(`   - ${table.table_name}`));
    }

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Custom RPC function to list tables (optional)
const createTableListFunction = `
CREATE OR REPLACE FUNCTION get_tables_list()
RETURNS TABLE(table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

testConnection().then(success => {
  if (!success) {
    console.log('\n💡 Tips:');
    console.log('1. Make sure you have created a .env file in the CYYBackend directory');
    console.log('2. Check that your Supabase project is running');
    console.log('3. Verify your environment variables are correct');
    console.log('4. Ensure the database schema has been initialized');
    process.exit(1);
  } else {
    console.log('\n🎉 Connection test passed!');
    process.exit(0);
  }
});