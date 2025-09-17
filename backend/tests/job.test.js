const request = require('supertest');
const { app } = require('../index');
const db = require('../src/utils/database');

describe('Job API', () => {
  let studentToken;
  let studentUserId;
  let recruiterToken;
  let recruiterUserId;
  let adminToken;
  let adminUserId;
  let testCompanyId;
  let testJobId;

  beforeAll(async () => {
    // Clean up any existing test data - wipe all companies and jobs for clean slate
    try {
      await db.query('DELETE FROM jobs');
      await db.query('DELETE FROM companies');
    } catch (error) {
      // Ignore if tables don't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%jobtest%']);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%jobtest%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%jobtest%']);
  });

  afterAll(async () => {
    // Clean up test data (ignore errors if tables don't exist)
    try {
      await db.query('DELETE FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE name LIKE $1)', ['%Job Test Company%']);
    } catch (error) {
      // Ignore if jobs table doesn't exist yet
    }
    try {
      await db.query('DELETE FROM companies WHERE name LIKE $1', ['%Job Test Company%']);
    } catch (error) {
      // Ignore if companies table doesn't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%jobtest%']);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%jobtest%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%jobtest%']);
    await db.pool.end();
  });

  beforeEach(async () => {
    // Create student user
    const studentSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'student.jobtest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'student.jobtest@example.com',
        otp: studentSignup.body.otp
      });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student.jobtest@example.com',
        password: 'testpassword123'
      });

    studentToken = studentLogin.body.access_token;
    studentUserId = studentLogin.body.user.id;

    // Create recruiter user
    const recruiterSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'recruiter.jobtest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'recruiter.jobtest@example.com',
        otp: recruiterSignup.body.otp
      });

    // Update user role to recruiter
    await db.query('UPDATE users SET role = $1 WHERE email = $2', ['recruiter', 'recruiter.jobtest@example.com']);

    const recruiterLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'recruiter.jobtest@example.com',
        password: 'testpassword123'
      });

    recruiterToken = recruiterLogin.body.access_token;
    recruiterUserId = recruiterLogin.body.user.id;

    // Create admin user
    const adminSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'admin.jobtest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'admin.jobtest@example.com',
        otp: adminSignup.body.otp
      });

    // Update user role to admin
    await db.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', 'admin.jobtest@example.com']);

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.jobtest@example.com',
        password: 'testpassword123'
      });

    adminToken = adminLogin.body.access_token;
    adminUserId = adminLogin.body.user.id;

    // Create a test company for job tests
    const companyResponse = await request(app)
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        name: 'Job Test Company',
        description: 'A company for job testing',
        website: 'https://jobtestcompany.com'
      });

    testCompanyId = companyResponse.body.company.id;
  });

  afterEach(async () => {
    // Clean up after each test (ignore errors if tables don't exist)
    try {
      await db.query('DELETE FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE name LIKE $1)', ['%Job Test Company%']);
    } catch (error) {
      // Ignore if jobs table doesn't exist yet
    }
    try {
      await db.query('DELETE FROM companies WHERE name LIKE $1', ['%Job Test Company%']);
    } catch (error) {
      // Ignore if companies table doesn't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
  });

  describe('Authentication', () => {
    test('should require authentication for all job endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/v1/jobs' },
        { method: 'get', path: '/api/v1/jobs/123' },
        { method: 'post', path: '/api/v1/jobs' },
        { method: 'put', path: '/api/v1/jobs/123' },
        { method: 'delete', path: '/api/v1/jobs/123' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      }
    });

    test('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('GET /api/v1/jobs', () => {
    test('should allow all authenticated users to view jobs', async () => {
      // Create a test job first
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Test Job for View',
          description: 'A test job',
          eligibility: 'Bachelor degree required',
          application_deadline: futureDate.toISOString()
        });

      // Test student access
      const studentResponse = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${studentToken}`);

      console.log('DEBUG studentResponse:', studentResponse.body);
      expect(studentResponse.status).toBe(200);
      expect(studentResponse.body.jobs).toBeDefined();
      expect(studentResponse.body.count).toBeDefined();
      expect(studentResponse.body.jobs[0]).toHaveProperty('company_name');

      // Test recruiter access
      const recruiterResponse = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(recruiterResponse.status).toBe(200);
      expect(recruiterResponse.body.jobs).toBeDefined();
    });

    test('should return empty array when no jobs exist', async () => {
      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${studentToken}`);

      console.log('DEBUG jobs response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.jobs).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    beforeEach(async () => {
      // Create a test job
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Test Job for ID',
          description: 'A test job for ID tests',
          eligibility: 'Bachelor degree required',
          application_deadline: futureDate.toISOString()
        });
      testJobId = response.body.job.id;
    });

    test('should allow all authenticated users to view job by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.job).toMatchObject({
        id: testJobId,
        title: 'Test Job for ID',
        description: 'A test job for ID tests',
        eligibility: 'Bachelor degree required',
        company_id: testCompanyId,
        company_name: 'Job Test Company'
      });
    });

    test('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('POST /api/v1/jobs', () => {
    test('should allow recruiters to create jobs', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const jobData = {
        company_id: testCompanyId,
        title: 'Software Engineer',
        description: 'Develop amazing software',
        eligibility: 'Bachelor in Computer Science',
        application_deadline: futureDate.toISOString()
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(jobData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Job created successfully');
      expect(response.body.job).toMatchObject({
        title: jobData.title,
        description: jobData.description,
        eligibility: jobData.eligibility,
        company_id: testCompanyId,
        company_name: 'Job Test Company'
      });
      expect(response.body.job.id).toBeDefined();
    });

    test('should allow admins to create jobs', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const jobData = {
        company_id: testCompanyId,
        title: 'Admin Created Job',
        application_deadline: futureDate.toISOString()
      };

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(jobData);

      expect(response.status).toBe(201);
      expect(response.body.job.title).toBe('Admin Created Job');
    });

    test('should deny students from creating jobs', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Student Job',
          application_deadline: futureDate.toISOString()
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContain('Job title is required');
      expect(response.body.details).toContain('Application deadline is required');
      expect(response.body.details).toContain('Company ID is required');
    });

    test('should validate job title length', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'a'.repeat(256),
          application_deadline: futureDate.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Job title must be less than 255 characters');
    });

    test('should validate application deadline is in future', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Past Deadline Job',
          application_deadline: pastDate.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Application deadline must be in the future');
    });

    test('should validate invalid deadline format', async () => {
      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Invalid Deadline Job',
          application_deadline: 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('Invalid application deadline format');
    });

    test('should validate company exists', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: '00000000-0000-0000-0000-000000000000',
          title: 'Non-existent Company Job',
          application_deadline: futureDate.toISOString()
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Company not found');
    });
  });

  describe('PUT /api/v1/jobs/:id', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Original Job Title',
          description: 'Original description',
          eligibility: 'Original eligibility',
          application_deadline: futureDate.toISOString()
        });
      testJobId = response.body.job.id;
    });

    test('should allow recruiters to update jobs', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      const updateData = {
        company_id: testCompanyId,
        title: 'Updated Job Title',
        description: 'Updated description',
        eligibility: 'Updated eligibility',
        application_deadline: futureDate.toISOString()
      };

      const response = await request(app)
        .put(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Job updated successfully');
      expect(response.body.job).toMatchObject({
        title: updateData.title,
        description: updateData.description,
        eligibility: updateData.eligibility
      });
    });

    test('should allow admins to update jobs', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      const response = await request(app)
        .put(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Admin Updated Job',
          application_deadline: futureDate.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.job.title).toBe('Admin Updated Job');
    });

    test('should deny students from updating jobs', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      const response = await request(app)
        .put(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Student Updated Job',
          application_deadline: futureDate.toISOString()
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should return 404 for non-existent job', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);

      const response = await request(app)
        .put('/api/v1/jobs/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Non-existent Job',
          application_deadline: futureDate.toISOString()
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job not found');
    });

    test('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: '',
          application_deadline: 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/v1/jobs/:id', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Delete Test Job',
          description: 'Job to be deleted',
          application_deadline: futureDate.toISOString()
        });
      testJobId = response.body.job.id;
    });

    test('should allow recruiters to delete jobs', async () => {
      const response = await request(app)
        .delete(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Job deleted successfully');
      expect(response.body.deletedJob.title).toBe('Delete Test Job');
      expect(response.body.deletedJob.company_name).toBe('Job Test Company');

      // Verify job is deleted
      const getResponse = await request(app)
        .get(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(getResponse.status).toBe(404);
    });

    test('should allow admins to delete jobs', async () => {
      const response = await request(app)
        .delete(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('should deny students from deleting jobs', async () => {
      const response = await request(app)
        .delete(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .delete('/api/v1/jobs/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('Data Integrity', () => {
    test('should maintain referential integrity with companies', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      // Create a job
      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Integrity Test Job',
          application_deadline: futureDate.toISOString()
        });

      const jobId = jobResponse.body.job.id;

      // Verify job exists
      let getJobResponse = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(getJobResponse.status).toBe(200);

      // Delete the company (should cascade delete the job)
      await request(app)
        .delete(`/api/v1/companies/${testCompanyId}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      // Verify job is also deleted
      getJobResponse = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(getJobResponse.status).toBe(404);
    });

    test('should sort jobs by application deadline', async () => {
      const nearDate = new Date();
      nearDate.setDate(nearDate.getDate() + 10);
      
      const farDate = new Date();
      farDate.setDate(farDate.getDate() + 50);

      // Create jobs with different deadlines
      await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Far Deadline Job',
          application_deadline: farDate.toISOString()
        });

      await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          company_id: testCompanyId,
          title: 'Near Deadline Job',
          application_deadline: nearDate.toISOString()
        });

      const response = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${studentToken}`);

      console.log('DEBUG jobs response:', response.body);
      expect(response.status).toBe(200);
      expect(response.body.jobs).toHaveLength(2);
      
      // Should be sorted by deadline (ascending)
      expect(response.body.jobs[0].title).toBe('Near Deadline Job');
      expect(response.body.jobs[1].title).toBe('Far Deadline Job');
    });
  });
});
