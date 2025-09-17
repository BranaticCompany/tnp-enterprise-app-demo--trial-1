const request = require('supertest');
const { app } = require('../index');
const db = require('../src/utils/database');

describe('Application API', () => {
  let studentToken;
  let studentUserId;
  let recruiterToken;
  let recruiterUserId;
  let adminToken;
  let adminUserId;
  let testCompanyId;
  let testJobId;

  beforeAll(async () => {
    // Clean up any existing test data
    try {
      await db.query('DELETE FROM applications');
      await db.query('DELETE FROM jobs');
      await db.query('DELETE FROM companies');
    } catch (error) {
      // Ignore if tables don't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%apptest%']);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%apptest%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%apptest%']);
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await db.query('DELETE FROM applications');
      await db.query('DELETE FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE name LIKE $1)', ['%App Test Company%']);
      await db.query('DELETE FROM companies WHERE name LIKE $1', ['%App Test Company%']);
    } catch (error) {
      // Ignore if tables don't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%apptest%']);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)', ['%apptest%']);
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%apptest%']);
    await db.pool.end();
  });

  beforeEach(async () => {
    // Create student user
    const studentSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'student.apptest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'student.apptest@example.com',
        otp: studentSignup.body.otp
      });

    await db.query('UPDATE users SET role = $1 WHERE email = $2', ['student', 'student.apptest@example.com']);

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student.apptest@example.com',
        password: 'testpassword123'
      });

    studentToken = studentLogin.body.access_token;
    studentUserId = studentLogin.body.user.id;

    // Create recruiter user
    const recruiterSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'recruiter.apptest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'recruiter.apptest@example.com',
        otp: recruiterSignup.body.otp
      });

    await db.query('UPDATE users SET role = $1 WHERE email = $2', ['recruiter', 'recruiter.apptest@example.com']);

    const recruiterLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'recruiter.apptest@example.com',
        password: 'testpassword123'
      });

    recruiterToken = recruiterLogin.body.access_token;
    recruiterUserId = recruiterLogin.body.user.id;

    // Create admin user
    const adminSignup = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: 'admin.apptest@example.com',
        password: 'testpassword123'
      });

    await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'admin.apptest@example.com',
        otp: adminSignup.body.otp
      });

    await db.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', 'admin.apptest@example.com']);

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.apptest@example.com',
        password: 'testpassword123'
      });

    adminToken = adminLogin.body.access_token;
    adminUserId = adminLogin.body.user.id;

    // Create test company and job
    const companyResponse = await request(app)
      .post('/api/v1/companies')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        name: 'App Test Company',
        description: 'A company for application testing',
        website: 'https://apptestcompany.com'
      });

    testCompanyId = companyResponse.body.company.id;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const jobResponse = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        company_id: testCompanyId,
        title: 'Test Job for Applications',
        description: 'A test job for application testing',
        eligibility: 'Bachelor degree required',
        application_deadline: futureDate.toISOString()
      });

    testJobId = jobResponse.body.job.id;
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await db.query('DELETE FROM applications WHERE student_id IN ($1, $2, $3) OR job_id = $4', [studentUserId, recruiterUserId, adminUserId, testJobId]);
      await db.query('DELETE FROM jobs WHERE id = $1', [testJobId]);
      await db.query('DELETE FROM companies WHERE id = $1', [testCompanyId]);
    } catch (error) {
      // Ignore if tables don't exist yet
    }
    await db.query('DELETE FROM profiles WHERE user_id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [studentUserId, recruiterUserId, adminUserId]);
  });

  describe('Authentication', () => {
    test('should require authentication for all application endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/v1/applications' },
        { method: 'get', path: '/api/v1/applications/me' },
        { method: 'get', path: '/api/v1/applications/job/123' },
        { method: 'get', path: '/api/v1/applications' },
        { method: 'put', path: '/api/v1/applications/123/status' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Access token required');
      }
    });
  });

  describe('POST /api/v1/applications - Apply for Job', () => {
    test('should allow students to apply for jobs', async () => {
      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Application submitted successfully');
      expect(response.body.application).toMatchObject({
        student_id: studentUserId,
        job_id: testJobId,
        status: 'applied',
        job_title: 'Test Job for Applications',
        company_name: 'App Test Company'
      });
    });

    test('should prevent duplicate applications', async () => {
      // First application
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });

      // Second application (should fail)
      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('You have already applied for this job');
    });

    test('should block applications after deadline', async () => {
      // Create job with past deadline by temporarily disabling constraint
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      // Temporarily disable the constraint
      await db.query('ALTER TABLE jobs DISABLE TRIGGER ALL');
      await db.query('ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_future_deadline');

      const pastJobResult = await db.query(`
        INSERT INTO jobs (company_id, title, description, application_deadline) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id
      `, [testCompanyId, 'Past Deadline Job', 'Test job with past deadline', pastDate.toISOString()]);

      // Re-enable triggers and constraint
      await db.query('ALTER TABLE jobs ENABLE TRIGGER ALL');
      await db.query('ALTER TABLE jobs ADD CONSTRAINT chk_future_deadline CHECK (application_deadline > CURRENT_TIMESTAMP) NOT VALID');

      const pastJobId = pastJobResult.rows[0].id;

      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: pastJobId });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Application deadline has passed');
    });

    test('should deny non-students from applying', async () => {
      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({ job_id: testJobId });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    test('should validate job exists', async () => {
      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: '00000000-0000-0000-0000-000000000000' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Job not found');
    });

    test('should require job_id', async () => {
      const response = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Job ID is required');
    });
  });

  describe('GET /api/v1/applications/me - Student Applications', () => {
    test('should allow students to view their applications', async () => {
      // Apply for job first
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });

      const response = await request(app)
        .get('/api/v1/applications/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0]).toMatchObject({
        status: 'applied',
        job_title: 'Test Job for Applications',
        company_name: 'App Test Company'
      });
      expect(response.body.count).toBe(1);
    });

    test('should deny non-students from viewing student applications', async () => {
      const response = await request(app)
        .get('/api/v1/applications/me')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/v1/applications/job/:jobId - Job Applications', () => {
    test('should allow recruiters to view job applications', async () => {
      // Student applies first
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });

      const response = await request(app)
        .get(`/api/v1/applications/job/${testJobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.job).toMatchObject({
        id: testJobId,
        title: 'Test Job for Applications',
        company_name: 'App Test Company'
      });
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0]).toMatchObject({
        status: 'applied',
        student_email: 'student.apptest@example.com'
      });
    });

    test('should deny students from viewing job applications', async () => {
      const response = await request(app)
        .get(`/api/v1/applications/job/${testJobId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/v1/applications - All Applications', () => {
    test('should allow admins to view all applications', async () => {
      // Student applies first
      await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });

      const response = await request(app)
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.applications).toHaveLength(1);
      expect(response.body.applications[0]).toMatchObject({
        status: 'applied',
        student_email: 'student.apptest@example.com',
        job_title: 'Test Job for Applications',
        company_name: 'App Test Company'
      });
    });

    test('should deny non-admins from viewing all applications', async () => {
      const response = await request(app)
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('PUT /api/v1/applications/:id/status - Update Status', () => {
    let applicationId;

    beforeEach(async () => {
      const appResponse = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });
      
      expect(appResponse.status).toBe(201);
      expect(appResponse.body.application).toBeDefined();
      applicationId = appResponse.body.application.id;
    });

    test('should allow recruiters to update application status', async () => {
      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({ status: 'reviewed' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Application status updated successfully');
      expect(response.body.application).toMatchObject({
        status: 'reviewed',
        previous_status: 'applied'
      });
    });

    test('should validate status values', async () => {
      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid status');
      expect(response.body.validStatuses).toContain('applied');
    });

    test('should deny students from updating status', async () => {
      const response = await request(app)
        .put(`/api/v1/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'reviewed' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('Data Integrity', () => {
    test('should cascade delete applications when job is deleted', async () => {
      // Apply for job
      const appResponse = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });

      expect(appResponse.status).toBe(201);
      expect(appResponse.body.application).toBeDefined();
      const applicationId = appResponse.body.application.id;

      // Verify application exists
      const checkApp = await db.query('SELECT id FROM applications WHERE id = $1', [applicationId]);
      expect(checkApp.rows).toHaveLength(1);

      // Delete job
      await request(app)
        .delete(`/api/v1/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`);

      // Verify application is deleted
      const checkAppAfter = await db.query('SELECT id FROM applications WHERE id = $1', [applicationId]);
      expect(checkAppAfter.rows).toHaveLength(0);
    });

    test('should cascade delete applications when student is deleted', async () => {
      // Apply for job
      const appResponse = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ job_id: testJobId });

      expect(appResponse.status).toBe(201);
      expect(appResponse.body.application).toBeDefined();

      // Verify application exists
      const checkApp = await db.query('SELECT id FROM applications WHERE student_id = $1', [studentUserId]);
      expect(checkApp.rows).toHaveLength(1);

      // Delete student user
      await db.query('DELETE FROM users WHERE id = $1', [studentUserId]);

      // Verify application is deleted
      const checkAppAfter = await db.query('SELECT id FROM applications WHERE student_id = $1', [studentUserId]);
      expect(checkAppAfter.rows).toHaveLength(0);
    });
  });
});
