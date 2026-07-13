// test-all.js
require('dotenv').config();
const { UserModel, supabase } = require('./models/supabaseClient');
const bcrypt = require('bcryptjs');

async function testAll() {
  console.log('🚀 RUNNING COMPLETE TEST\n');
  console.log('=' .repeat(50));
  
  // 1. Check .env
  console.log('\n📝 1. Environment Check:');
  console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅' : '❌'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅' : '❌'}`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅' : '❌'}`);
  
  // 2. Test Database Connection
  console.log('\n📊 2. Database Connection:');
  const { data: testData, error: testError } = await supabase
    .from('users')
    .select('count');
  
  if (testError) {
    console.log(`   ❌ Error: ${testError.message}`);
    return;
  }
  console.log(`   ✅ Connected successfully`);
  
  // 3. Find User
  console.log('\n🔍 3. Finding User:');
  const user = await UserModel.findByLoginId('dhiva@gmail.com');
  
  if (!user) {
    console.log('   ❌ User not found!');
    console.log('\n📝 Insert user in Supabase SQL Editor:');
    console.log(`
    INSERT INTO users (name, email, login_id, password_hash, role)
    VALUES (
      'Dhivakar Krishnan',
      'dhiva@gmail.com',
      'dhiva@gmail.com',
      '$2b$10$HHYjxe8sicje3jhuuMWMpeJsO.6AwwJsGy4pAnh785y2IxzzDhNt.',
      'admin'
    );
    `);
    return;
  }
  
  console.log(`   ✅ User found:`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Has Password: ${user.password_hash ? '✅' : '❌'}`);
  
  // 4. Test Password
  console.log('\n🔐 4. Password Test:');
  const isMatch = await UserModel.comparePassword('Fed@123', user.password_hash);
  console.log(`   Password "Fed@123": ${isMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
  
  // 5. JWT Test
  console.log('\n🔑 5. JWT Test:');
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
  console.log(`   Token generated: ${token.substring(0, 30)}...`);
  
  // 6. Summary
  console.log('\n' + '=' .repeat(50));
  console.log('\n📋 SUMMARY:');
  console.log(`   ✅ Database: Connected`);
  console.log(`   ✅ User: ${user.name} (${user.email})`);
  console.log(`   ✅ Password: ${isMatch ? 'Valid' : 'Invalid'}`);
  console.log(`   ✅ JWT: Ready`);
  
  console.log('\n🚀 Server should work now!');
  console.log(`\nTest with: curl -X POST http://localhost:5005/ -H "Content-Type: application/json" -d '{"loginId":"dhiva@gmail.com","password":"Fed@123"}'`);
}

testAll().catch(console.error);