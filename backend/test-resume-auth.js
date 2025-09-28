// Test script to verify resume authorization is fixed
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testResumeAuth() {
    try {
        console.log('🧪 Testing Resume Authorization Fix...\n');

        // Login as student
        const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
            email: 'john.doe@student.edu',
            password: 'password123'
        });

        const token = loginResponse.data.access_token;
        const userId = loginResponse.data.user.id;
        console.log(`✅ Login successful. User ID: ${userId}`);

        // Test resume info (should work)
        console.log('\n1. Testing resume info (should work)...');
        try {
            const infoResponse = await axios.get(`http://localhost:3001/api/v1/students/${userId}/resume/info`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Resume info success:', infoResponse.data.success);
        } catch (error) {
            console.log('❌ Resume info error:', error.response?.data?.message);
        }

        // Test resume delete (should work now)
        console.log('\n2. Testing resume delete authorization (should work now)...');
        try {
            const deleteResponse = await axios.delete(`http://localhost:3001/api/v1/students/${userId}/resume`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Resume delete success:', deleteResponse.data.message);
        } catch (error) {
            console.log('❌ Resume delete error:', error.response?.data?.message);
        }

        // Test resume upload (should work now)
        console.log('\n3. Testing resume upload authorization (should work now)...');
        try {
            // Create a simple test file
            const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n178\n%%EOF');
            
            const formData = new FormData();
            formData.append('resume', testPdfContent, {
                filename: 'test-resume.pdf',
                contentType: 'application/pdf'
            });

            const uploadResponse = await axios.post(`http://localhost:3001/api/v1/students/${userId}/resume`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            });
            console.log('✅ Resume upload success:', uploadResponse.data.message);
        } catch (error) {
            console.log('❌ Resume upload error:', error.response?.data?.message);
        }

        console.log('\n🎉 Resume authorization test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testResumeAuth();
