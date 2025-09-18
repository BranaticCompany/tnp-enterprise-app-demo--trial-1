const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

const testAccounts = [
  { email: 'admin@tnp.edu', password: 'password123', role: 'admin' },
  { email: 'recruiter@techcorp.com', password: 'password123', role: 'recruiter' },
  { email: 'john.doe@student.edu', password: 'password123', role: 'student' }
];

async function testLogin(account) {
  try {
    console.log(`\n🔐 Testing login for ${account.email} (${account.role})...`);
    
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email: account.email,
      password: account.password
    });
    
    if (response.data.access_token && response.data.user) {
      console.log(`✅ Login successful!`);
      console.log(`   Token: ${response.data.access_token.substring(0, 20)}...`);
      console.log(`   User: ${response.data.user.email} (${response.data.user.role})`);
      return true;
    } else {
      console.log(`❌ Login failed: Invalid response format`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Login failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing TnP Portal Login Functionality\n');
  
  let successCount = 0;
  
  for (const account of testAccounts) {
    const success = await testLogin(account);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Test Results: ${successCount}/${testAccounts.length} accounts working`);
  
  if (successCount === testAccounts.length) {
    console.log('🎉 All demo accounts are working correctly!');
  } else {
    console.log('⚠️  Some accounts need attention');
  }
}

runTests().catch(console.error);
