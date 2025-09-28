// Simple test script to verify resume API functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testResumeAPI() {
    try {
        console.log('🧪 Testing Resume API functionality...\n');

        // First, let's login to get a JWT token
        console.log('1. Logging in as student...');
        const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            email: 'john.doe@student.edu',
            password: 'password123'
        });

        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        console.log(`✅ Login successful. User ID: ${userId}`);

        // Set up axios with auth header
        const authAxios = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Test getting resume info
        console.log('\n2. Testing resume info endpoint...');
        try {
            const resumeInfoResponse = await authAxios.get(`/api/v1/students/${userId}/resume/info`);
            console.log('✅ Resume info response:', resumeInfoResponse.data);
        } catch (error) {
            console.log('❌ Resume info error:', error.response?.data || error.message);
        }

        // Test getting resume file (if exists)
        console.log('\n3. Testing resume download endpoint...');
        try {
            const resumeResponse = await authAxios.get(`/api/v1/students/${userId}/resume`);
            console.log('✅ Resume download successful. Content-Type:', resumeResponse.headers['content-type']);
        } catch (error) {
            console.log('❌ Resume download error:', error.response?.data || error.message);
        }

        console.log('\n🎉 Resume API test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testResumeAPI();
