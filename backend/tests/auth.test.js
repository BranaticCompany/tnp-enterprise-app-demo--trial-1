const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../index');
const db = require('../src/utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Password123'
};

// Clean up function
const cleanupTestData = async () => {
  await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [testUser.email]);
  await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);
};

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    if (db && db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    } else if (db && typeof db.end === 'function') {
      await db.end();
    }
  });

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty('otp_sent', true);
      expect(response.body).toHaveProperty('otp');
      expect(response.body.otp).toMatch(/^\d{6}$/);

      // Verify user was created in database
      const userResult = await db.query('SELECT * FROM users WHERE email = $1', [testUser.email]);
      expect(userResult.rows).toHaveLength(1);
      expect(userResult.rows[0].is_verified).toBe(false);
      expect(userResult.rows[0].role).toBe('user');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'invalid-email', password: 'Password123' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com', password: '123' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Password must be at least 8 characters long');
    });

    it('should reject duplicate email', async () => {
      // First signup
      await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(200);

      // Second signup with same email
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    let otp;

    beforeEach(async () => {
      const signupResponse = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser);
      otp = signupResponse.body.otp;
    });

    it('should verify OTP and mark user as verified', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testUser.email, otp })
        .expect(200);

      expect(response.body).toHaveProperty('verified', true);

      // Verify user is marked as verified in database
      const userResult = await db.query('SELECT is_verified FROM users WHERE email = $1', [testUser.email]);
      expect(userResult.rows[0].is_verified).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testUser.email, otp: '000000' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid OTP');
    });

    it('should reject missing email or OTP', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and OTP are required');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create and verify user
      const signupResponse = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser);
      
      await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testUser.email, otp: signupResponse.body.otp });
    });

    it('should login successfully and return tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('role', 'user');

      // Verify JWT payload
      const decoded = jwt.verify(response.body.access_token, JWT_SECRET);
      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('role', 'user');
    });

    it('should reject unverified user', async () => {
      // Create unverified user
      await cleanupTestData();
      await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'unverified@example.com', password: 'Password123' });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'unverified@example.com', password: 'Password123' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'verify_account');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create, verify and login user
      const signupResponse = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser);
      
      await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: testUser.email, otp: signupResponse.body.otp });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(testUser);

      refreshToken = loginResponse.body.refresh_token;
    });

    it('should return new access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');

      // Verify new JWT payload
      const decoded = jwt.verify(response.body.access_token, JWT_SECRET);
      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('role', 'user');

      // Verify new refresh token is different (token rotation)
      expect(response.body.refresh_token).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid or expired refresh token');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Refresh token is required');
    });
  });

  describe('GET /api/v1/auth', () => {
    it('should return auth routes health check', async () => {
      const response = await request(app)
        .get('/api/v1/auth')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Auth routes are working');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toContain('POST /signup');
    });
  });
});
