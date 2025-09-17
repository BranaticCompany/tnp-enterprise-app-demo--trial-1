const request = require('supertest');
const { app } = require('../index');
const db = require('../src/utils/database');

describe('Profile API', () => {
  let authToken;
  let userId;
  let secondAuthToken;
  let secondUserId;

  beforeAll(async () => {
    // Clean up any existing test data
    await db.query('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%test%']);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%test%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);
  });

  afterAll(async () => {
    // Clean up test data
    await db.query('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%test%']);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%test%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);
    await db.pool.end();
  });

  beforeEach(async () => {
    // Create test user and get auth token
    const signupResponse = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'profiletest@example.com',
        password: 'testpassword123'
      });

    expect(signupResponse.status).toBe(200);

    // Verify OTP
    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'profiletest@example.com',
        otp: signupResponse.body.otp
      });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'profiletest@example.com',
        password: 'testpassword123'
      });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.access_token;
    userId = loginResponse.body.user.id;

    // Create second test user for authorization tests
    const secondSignupResponse = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'profiletest2@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'profiletest2@example.com',
        otp: secondSignupResponse.body.otp
      });

    const secondLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'profiletest2@example.com',
        password: 'testpassword123'
      });

    secondAuthToken = secondLoginResponse.body.access_token;
    secondUserId = secondLoginResponse.body.user.id;
  });

  afterEach(async () => {
    // Clean up after each test
    await db.query('DELETE FROM profiles WHERE user_id IN ($1, $2)', [userId, secondUserId]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN ($1, $2)', [userId, secondUserId]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [userId, secondUserId]);
  });

  describe('Authentication', () => {
    test('should require authentication for all profile endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/v1/profile/me' },
        { method: 'post', path: '/api/v1/profile' },
        { method: 'put', path: '/api/v1/profile' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      }
    });

    test('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid token');
    });

    test('should accept valid tokens', async () => {
      const response = await request(app)
        .get('/api/v1/profile/')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile routes are working');
    });
  });

  describe('GET /api/v1/profile/me', () => {
    test('should return 404 when profile does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Profile not found');
    });

    test('should return profile when it exists', async () => {
      // First create a profile
      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          full_name: 'John Doe',
          phone: '+1234567890',
          branch: 'Computer Science',
          year_of_study: 3
        });

      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.profile).toMatchObject({
        full_name: 'John Doe',
        phone: '+1234567890',
        branch: 'Computer Science',
        year_of_study: 3,
        user_id: userId
      });
    });
  });

  describe('POST /api/v1/profile', () => {
    test('should create profile with valid data', async () => {
      const profileData = {
        full_name: 'Jane Smith',
        phone: '+9876543210',
        branch: 'Electrical Engineering',
        year_of_study: 2,
        resume_url: 'https://example.com/resume.pdf'
      };

      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Profile created successfully');
      expect(response.body.profile).toMatchObject({
        ...profileData,
        user_id: userId
      });
    });

    test('should create profile with minimal data', async () => {
      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(201);
      expect(response.body.profile.user_id).toBe(userId);
    });

    test('should prevent creating duplicate profiles', async () => {
      // Create first profile
      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'John Doe' });

      // Try to create second profile
      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'Jane Doe' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Profile already exists. Use PUT to update.');
    });

    test('should validate phone number format', async () => {
      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ phone: 'invalid-phone' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Invalid phone number format');
    });

    test('should validate year of study range', async () => {
      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year_of_study: 10 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Year of study must be between 1 and 5');
    });

    test('should reject empty full_name', async () => {
      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Full name cannot be empty');
    });

    test('should reject empty branch', async () => {
      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ branch: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Branch cannot be empty');
    });
  });

  describe('PUT /api/v1/profile', () => {
    beforeEach(async () => {
      // Create initial profile for update tests
      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          full_name: 'Original Name',
          phone: '+1111111111',
          branch: 'Original Branch',
          year_of_study: 1
        });
    });

    test('should update profile with valid data', async () => {
      const updateData = {
        full_name: 'Updated Name',
        phone: '+2222222222',
        branch: 'Updated Branch',
        year_of_study: 4,
        resume_url: 'https://example.com/new-resume.pdf'
      };

      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.profile).toMatchObject({
        ...updateData,
        user_id: userId
      });
    });

    test('should return 404 when profile does not exist', async () => {
      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({ full_name: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Profile not found. Use POST to create.');
    });

    test('should validate data on update', async () => {
      const response = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          phone: 'invalid',
          year_of_study: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Invalid phone number format');
      expect(response.body.details).toContain('Year of study must be between 1 and 5');
    });
  });

  describe('Authorization', () => {
    test('should ensure users can only access their own profile', async () => {
      // Create profile for first user
      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'User One' });

      // Create profile for second user
      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({ full_name: 'User Two' });

      // First user should only see their own profile
      const response1 = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response1.status).toBe(200);
      expect(response1.body.profile.full_name).toBe('User One');
      expect(response1.body.profile.user_id).toBe(userId);

      // Second user should only see their own profile
      const response2 = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${secondAuthToken}`);

      expect(response2.status).toBe(200);
      expect(response2.body.profile.full_name).toBe('User Two');
      expect(response2.body.profile.user_id).toBe(secondUserId);
    });

    test('should ensure users can only update their own profile', async () => {
      // Create profiles for both users
      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'User One' });

      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({ full_name: 'User Two' });

      // Each user can only update their own profile
      const response1 = await request(app)
        .put('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'Updated User One' });

      expect(response1.status).toBe(200);
      expect(response1.body.profile.full_name).toBe('Updated User One');

      // Verify the other user's profile wasn't affected
      const response2 = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${secondAuthToken}`);

      expect(response2.status).toBe(200);
      expect(response2.body.profile.full_name).toBe('User Two');
    });
  });

  describe('Data Integrity', () => {
    test('should maintain 1:1 relationship between user and profile', async () => {
      // Create profile
      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'Test User' });

      // Verify only one profile exists for this user
      const result = await db.query('SELECT COUNT(*) as count FROM profiles WHERE user_id = $1', [userId]);
      expect(parseInt(result.rows[0].count)).toBe(1);

      // Try to create another profile (should fail)
      const response = await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'Another Profile' });

      expect(response.status).toBe(409);

      // Verify still only one profile
      const result2 = await db.query('SELECT COUNT(*) as count FROM profiles WHERE user_id = $1', [userId]);
      expect(parseInt(result2.rows[0].count)).toBe(1);
    });

    test('should handle cascade delete when user is deleted', async () => {
      // Create profile
      await request(app)
        .post('/api/v1/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'Test User' });

      // Verify profile exists
      let result = await db.query('SELECT COUNT(*) as count FROM profiles WHERE user_id = $1', [userId]);
      expect(parseInt(result.rows[0].count)).toBe(1);

      // Delete user (this should cascade delete the profile)
      await db.query('DELETE FROM users WHERE id = $1', [userId]);

      // Verify profile was deleted
      result = await db.query('SELECT COUNT(*) as count FROM profiles WHERE user_id = $1', [userId]);
      expect(parseInt(result.rows[0].count)).toBe(0);
    });
  });
});
