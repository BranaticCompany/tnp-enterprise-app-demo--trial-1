// Simple test to check profile endpoint
const axios = require('axios');

async function testProfile() {
    try {
        // Login
        const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
            email: 'john.doe@student.edu',
            password: 'password123'
        });

        console.log('Login response:', {
            success: loginResponse.data.success,
            access_token: loginResponse.data.access_token ? 'Present' : 'Missing',
            user: loginResponse.data.user ? 'Present' : 'Missing'
        });

        // Test profile with token
        const token = loginResponse.data.access_token;
        const profileResponse = await axios.get('http://localhost:3001/api/v1/profile/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Profile response:', {
            success: 'Success',
            profile: profileResponse.data.profile ? 'Present' : 'Missing',
            cgpa: profileResponse.data.profile?.cgpa,
            resume_url: profileResponse.data.profile?.resume_url
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testProfile();
