const request = require('supertest');
const { app } = require('../index');
const db = require('../src/utils/database');

describe('Company API', () => {
  let studentToken;
  let studentUserId;
  let recruiterToken;
  let recruiterUserId;
  let adminToken;
  let adminUserId;
  let testCompanyId;

  beforeAll(async () => {
    // Clean up any existing test data - wipe all companies and jobs for clean slate
    try {
      await db.query('DELETE FROM jobs');
      await db.query('DELETE FROM companies');
    } catch (error) {
      // Ignore if tables don't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%companytest%']);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%companytest%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%companytest%']);
  });

  afterAll(async () => {
    // Clean up test data (ignore errors if tables don't exist)
    try {
      await db.query('DELETE FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE name LIKE $1)', ['%Test Company%']);
    } catch (error) {
      // Ignore if jobs table doesn't exist yet
    }
    try {
      await db.query('DELETE FROM companies WHERE name LIKE $1', ['%Test Company%']);
    } catch (error) {
      // Ignore if companies table doesn't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%companytest%']);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%companytest%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%companytest%']);
    await db.pool.end();
  });

  beforeEach(async () => {
    // Create student user
    const studentSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'student.companytest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'student.companytest@example.com',
        otp: studentSignup.body.otp
      });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student.companytest@example.com',
        password: 'testpassword123'
      });

    studentToken = studentLogin.body.access_token;
    studentUserId = studentLogin.body.user.id;

    // Create recruiter user
    const recruiterSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'recruiter.companytest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'recruiter.companytest@example.com',
        otp: recruiterSignup.body.otp
      });

    // Update user role to recruiter
    await db.query('UPDATE users SET role = $1 WHERE email = $2', ['recruiter', 'recruiter.companytest@example.com']);

    const recruiterLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'recruiter.companytest@example.com',
        password: 'testpassword123'
      });

    recruiterToken = recruiterLogin.body.access_token;
    recruiterUserId = recruiterLogin.body.user.id;

    // Create admin user
    const adminSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'admin.companytest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'admin.companytest@example.com',
        otp: adminSignup.body.otp
      });

    // Update user role to admin
    await db.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', 'admin.companytest@example.com']);

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.companytest@example.com',
        password: 'testpassword123'
      });

    adminToken = adminLogin.body.access_token;
    adminUserId = adminLogin.body.user.id;
  });

  afterEach(async () => {
    // Clean up after each test (ignore errors if tables don't exist)
    try {
      await db.query('DELETE FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE name LIKE $1)', ['%Test Company%']);
    } catch (error) {
      // Ignore if jobs table doesn't exist yet
    }
    try {
      await db.query('DELETE FROM companies WHERE name LIKE $1', ['%Test Company%']);
    } catch (error) {
      // Ignore if companies table doesn't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
  });

  describe('Authentication', () => {
    test('should require authentication for all company endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/v1/companies' },
        { method: 'get', path: '/api/v1/companies/123' },
        { method: 'post', path: '/api/v1/companies' },
        { method: 'put', path: '/api/v1/companies/123' },
        { method: 'delete', path: '/api/v1/companies/123' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      }
    });

    test('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('GET /api/v1/companies', () => {
    test('should allow all authenticated users to view companies', async () => {
      // Create a test company first
      await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Test Company for View',
          description: 'A test company',
          website: 'https://testcompany.com'
        });

      // Test student access
      const studentResponse = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(studentResponse.status).toBe(200);
      expect(studentResponse.body.companies).toBeDefined();
      expect(studentResponse.body.count).toBeDefined();

      // Test recruiter access
      const recruiterResponse = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(recruiterResponse.status).toBe(200);
      expect(recruiterResponse.body.companies).toBeDefined();
    });

    test('should return empty array when no companies exist', async () => {
      const response = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.companies).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/v1/companies/:id', () => {
    beforeEach(async () => {
      // Create a test company
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Test Company for ID',
          description: 'A test company for ID tests',
          website: 'https://testcompanyid.com'
        });
      testCompanyId = response.body.company.id;
    });

    test('should allow all authenticated users to view company by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.company).toMatchObject({
        id: testCompanyId,
        name: 'Test Company for ID',
        description: 'A test company for ID tests',
        website: 'https://testcompanyid.com'
      });
    });

    test('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .get('/api/v1/companies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Company not found');
    });
  });

  describe('POST /api/v1/companies', () => {
    test('should allow recruiters to create companies', async () => {
      const companyData = {
        name: 'New Test Company',
        description: 'A new test company',
        website: 'https://newtestcompany.com'
      };

      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Company created successfully');
      expect(response.body.company).toMatchObject(companyData);
      expect(response.body.company.id).toBeDefined();
    });

    test('should allow admins to create companies', async () => {
      const companyData = {
        name: 'Admin Test Company',
        description: 'A test company created by admin'
      };

      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body.company).toMatchObject(companyData);
    });

    test('should deny students from creating companies', async () => {
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Student Test Company'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Company name is required');
    });

    test('should validate company name length', async () => {
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'a'.repeat(256)
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Company name must be less than 255 characters');
    });

    test('should validate website URL format', async () => {
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Test Company',
          website: 'invalid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Website must be a valid URL starting with http:// or https://');
    });

    test('should prevent duplicate company names', async () => {
      // Create first company
      await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Duplicate Test Company'
        });

      // Try to create second company with same name
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Duplicate Test Company'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Company with this name already exists');
    });

    test('should handle case-insensitive duplicate names', async () => {
      await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Case Test Company'
        });

      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'CASE TEST COMPANY'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Company with this name already exists');
    });
  });

  describe('PUT /api/v1/companies/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Original Test Company',
          description: 'Original description',
          website: 'https://original.com'
        });
      testCompanyId = response.body.company.id;
    });

    test('should allow recruiters to update companies', async () => {
      const updateData = {
        name: 'Updated Test Company',
        description: 'Updated description',
        website: 'https://updated.com'
      };

      const response = await request(app)
        .put(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Company updated successfully');
      expect(response.body.company).toMatchObject(updateData);
    });

    test('should allow admins to update companies', async () => {
      const response = await request(app)
        .put(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated Company'
        });

      expect(response.status).toBe(200);
      expect(response.body.company.name).toBe('Admin Updated Company');
    });

    test('should deny students from updating companies', async () => {
      const response = await request(app)
        .put(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Student Updated Company'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .put('/api/v1/companies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Non-existent Company'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Company not found');
    });

    test('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: '',
          website: 'invalid-url'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/v1/companies/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Delete Test Company',
          description: 'Company to be deleted'
        });
      testCompanyId = response.body.company.id;
    });

    test('should allow recruiters to delete companies', async () => {
      const response = await request(app)
        .delete(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Company deleted successfully');
      expect(response.body.deletedCompany.name).toBe('Delete Test Company');

      // Verify company is deleted
      const getResponse = await request(app)
        .get(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(getResponse.status).toBe(404);
    });

    test('should allow admins to delete companies', async () => {
      const response = await request(app)
        .delete(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('should deny students from deleting companies', async () => {
      const response = await request(app)
        .delete(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .delete('/api/v1/companies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Company not found');
    });
  });

  describe('Data Integrity', () => {
    test('should handle cascade delete of jobs when company is deleted', async () => {
      // This test will be more relevant when jobs are implemented
      // For now, just verify the company deletion works
      const response = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          name: 'Cascade Test Company'
        });

      const companyId = response.body.company.id;

      const deleteResponse = await request(app)
        .delete(`/api/v1/companies/${companyId}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(deleteResponse.status).toBe(200);
    });
  });
});
