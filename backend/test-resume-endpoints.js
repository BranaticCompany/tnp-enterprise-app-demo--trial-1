// Test script to verify resume endpoints are working
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testResumeEndpoints() {
    try {
        console.log('🧪 Testing Resume Endpoints...\n');

        // Login as student
        console.log('1. Logging in as student...');
        const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            email: 'john.doe@student.edu',
            password: 'password123'
        });

        const token = loginResponse.data.access_token;
        const userId = loginResponse.data.user.id;
        console.log(`✅ Login successful. User ID: ${userId}`);

        // Set up axios with auth header
        const authAxios = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Test getting profile to see resume_url
        console.log('\n2. Getting profile to check resume_url...');
        try {
            const profileResponse = await authAxios.get('/api/v1/profile/me');
            console.log('✅ Profile loaded successfully');
            console.log('Resume URL:', profileResponse.data.profile.resume_url);
            console.log('CGPA:', profileResponse.data.profile.cgpa);
        } catch (error) {
            console.log('❌ Profile error:', error.response?.data || error.message);
        }

        // Test getting resume info
        console.log('\n3. Testing resume info endpoint...');
        try {
            const resumeInfoResponse = await authAxios.get(`/api/v1/students/${userId}/resume/info`);
            console.log('✅ Resume info response:', resumeInfoResponse.data);
        } catch (error) {
            console.log('❌ Resume info error:', error.response?.data || error.message);
        }

        // Test getting resume file
        console.log('\n4. Testing resume download endpoint...');
        try {
            const resumeResponse = await authAxios.get(`/api/v1/students/${userId}/resume`);
            console.log('✅ Resume download successful. Content-Type:', resumeResponse.headers['content-type']);
            console.log('File size:', resumeResponse.data.length || 'Unknown');
        } catch (error) {
            console.log('❌ Resume download error:', error.response?.data || error.message);
        }

        console.log('\n🎉 Resume endpoint test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testResumeEndpoints();
