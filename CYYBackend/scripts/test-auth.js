require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔐 Testing authentication...\n');

  try {
    // Test sign up
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    const testUsername = `testuser_${Date.now()}`;

    console.log('1️⃣ Testing sign up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testUsername,
          display_name: 'Test User'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message);
      return false;
    }

    console.log('✅ Sign up successful!');
    console.log(`   Email: ${testEmail}`);
    console.log(`   User ID: ${signUpData.user?.id}`);

    // Test creating profile
    console.log('\n2️⃣ Testing profile creation...');
    if (signUpData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          username: testUsername,
          display_name: 'Test User'
        });

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError.message);
        return false;
      }
      console.log('✅ Profile created successfully!');
    }

    // Test sign in
    console.log('\n3️⃣ Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return false;
    }

    console.log('✅ Sign in successful!');
    console.log(`   Session access token: ${signInData.session?.access_token.substring(0, 20)}...`);

    // Test getting current user
    console.log('\n4️⃣ Testing get current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ Failed to get current user:', userError?.message);
      return false;
    }

    console.log('✅ Current user retrieved!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);

    // Test profile fetch
    console.log('\n5️⃣ Testing profile fetch...');
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileFetchError) {
      console.error('❌ Profile fetch failed:', profileFetchError.message);
      return false;
    }

    console.log('✅ Profile fetched successfully!');
    console.log(`   Username: ${profile.username}`);
    console.log(`   Display Name: ${profile.display_name}`);

    // Clean up - sign out
    console.log('\n6️⃣ Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message);
      return false;
    }

    console.log('✅ Sign out successful!');

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

testAuth().then(success => {
  if (success) {
    console.log('\n🎉 All authentication tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Authentication tests failed!');
    console.log('\n💡 Tips:');
    console.log('1. Make sure email auth is enabled in your Supabase project');
    console.log('2. Check that the profiles table has been created');
    console.log('3. Verify RLS policies are properly configured');
    process.exit(1);
  }
});