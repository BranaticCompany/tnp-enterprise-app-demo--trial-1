const request = require('supertest');
const { app } = require('../index');
const pool = require('../src/utils/database');
const jwt = require('jsonwebtoken');

describe('Interview Management', () => {
    let adminToken, recruiterToken, studentToken, student2Token;
    let adminUser, recruiterUser, studentUser, student2User;
    let testCompany, testJob, testApplication, testApplication2;

    beforeAll(async () => {
        // Clean up existing test data
        await pool.query('DELETE FROM interviews WHERE 1=1');
        await pool.query('DELETE FROM applications WHERE 1=1');
        await pool.query('DELETE FROM jobs WHERE 1=1');
        await pool.query('DELETE FROM companies WHERE 1=1');
        await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');

        // Create test users
        const adminResult = await pool.query(
            `INSERT INTO users (email, password_hash, role) 
             VALUES ($1, $2, $3) RETURNING *`,
            ['admin@test.com', 'hashedpassword', 'admin']
        );
        adminUser = adminResult.rows[0];

        const recruiterResult = await pool.query(
            `INSERT INTO users (email, password_hash, role) 
             VALUES ($1, $2, $3) RETURNING *`,
            ['recruiter@test.com', 'hashedpassword', 'recruiter']
        );
        recruiterUser = recruiterResult.rows[0];

        const studentResult = await pool.query(
            `INSERT INTO users (email, password_hash, role) 
             VALUES ($1, $2, $3) RETURNING *`,
            ['student@test.com', 'hashedpassword', 'student']
        );
        studentUser = studentResult.rows[0];

        const student2Result = await pool.query(
            `INSERT INTO users (email, password_hash, role) 
             VALUES ($1, $2, $3) RETURNING *`,
            ['student2@test.com', 'hashedpassword', 'student']
        );
        student2User = student2Result.rows[0];

        // Generate JWT tokens
        adminToken = jwt.sign(
            { id: adminUser.id, email: adminUser.email, role: adminUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        recruiterToken = jwt.sign(
            { id: recruiterUser.id, email: recruiterUser.email, role: recruiterUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        studentToken = jwt.sign(
            { id: studentUser.id, email: studentUser.email, role: studentUser.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        student2Token = jwt.sign(
            { id: student2User.id, email: student2User.email, role: student2User.role },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Create test company
        const companyResult = await pool.query(
            `INSERT INTO companies (name, description, website) 
             VALUES ($1, $2, $3) RETURNING *`,
            ['Test Company', 'A test company', 'https://testcompany.com']
        );
        testCompany = companyResult.rows[0];

        // Create test job
        const jobResult = await pool.query(
            `INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                testCompany.id,
                'Software Engineer',
                'Test job description',
                'Computer Science students',
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            ]
        );
        testJob = jobResult.rows[0];

        // Create test applications
        const applicationResult = await pool.query(
            `INSERT INTO applications (student_id, job_id, status) 
             VALUES ($1, $2, $3) RETURNING *`,
            [studentUser.id, testJob.id, 'shortlisted']
        );
        testApplication = applicationResult.rows[0];

        const application2Result = await pool.query(
            `INSERT INTO applications (student_id, job_id, status) 
             VALUES ($1, $2, $3) RETURNING *`,
            [student2User.id, testJob.id, 'shortlisted']
        );
        testApplication2 = application2Result.rows[0];
    });

    afterAll(async () => {
        // Clean up test data
        await pool.query('DELETE FROM interviews WHERE 1=1');
        await pool.query('DELETE FROM applications WHERE 1=1');
        await pool.query('DELETE FROM jobs WHERE 1=1');
        await pool.query('DELETE FROM companies WHERE 1=1');
        await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
    });

    describe('Authentication and Authorization', () => {
        test('should require authentication for all endpoints', async () => {
            const endpoints = [
                { method: 'get', path: '/api/v1/interviews' },
                { method: 'post', path: '/api/v1/interviews' },
                { method: 'get', path: '/api/v1/interviews/123' },
                { method: 'put', path: '/api/v1/interviews/123' },
                { method: 'delete', path: '/api/v1/interviews/123' }
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)[endpoint.method](endpoint.path);
                expect(response.status).toBe(401);
                expect(response.body.error).toBe('Access token required');
            }
        });

        test('should reject invalid tokens', async () => {
            const response = await request(app)
                .get('/api/v1/interviews')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Invalid token');
        });
    });

    describe('POST /api/v1/interviews - Create Interview', () => {
        test('should allow admin to create interview', async () => {
            const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            const interviewData = {
                application_id: testApplication.id,
                scheduled_at: futureDate.toISOString(),
                mode: 'online',
                status: 'scheduled'
            };

            const response = await request(app)
                .post('/api/v1/interviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(interviewData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Interview scheduled successfully');
            expect(response.body.interview).toHaveProperty('id');
            expect(response.body.interview.application_id).toBe(testApplication.id);
            expect(response.body.interview.mode).toBe('online');
            expect(response.body.interview.status).toBe('scheduled');
        });

        test('should allow recruiter to create interview', async () => {
            const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
            const interviewData = {
                application_id: testApplication2.id,
                scheduled_at: futureDate.toISOString(),
                mode: 'offline',
                status: 'scheduled'
            };

            const response = await request(app)
                .post('/api/v1/interviews')
                .set('Authorization', `Bearer ${recruiterToken}`)
                .send(interviewData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Interview scheduled successfully');
            expect(response.body.interview.mode).toBe('offline');
        });

        test('should not allow student to create interview', async () => {
            const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            const interviewData = {
                application_id: testApplication.id,
                scheduled_at: futureDate.toISOString(),
                mode: 'online'
            };

            const response = await request(app)
                .post('/api/v1/interviews')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(interviewData);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Insufficient permissions');
        });

        test('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/interviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing required fields');
        });

        test('should validate future date for scheduled_at', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
            const interviewData = {
                application_id: testApplication.id,
                scheduled_at: pastDate.toISOString(),
                mode: 'online'
            };

            const response = await request(app)
                .post('/api/v1/interviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(interviewData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('future date');
        });

        test('should validate mode enum', async () => {
            const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            const interviewData = {
                application_id: testApplication.id,
                scheduled_at: futureDate.toISOString(),
                mode: 'invalid_mode'
            };

            const response = await request(app)
                .post('/api/v1/interviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(interviewData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid mode');
        });

        test('should validate status enum', async () => {
            const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            const interviewData = {
                application_id: testApplication.id,
                scheduled_at: futureDate.toISOString(),
                mode: 'online',
                status: 'invalid_status'
            };

            const response = await request(app)
                .post('/api/v1/interviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(interviewData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid status');
        });

        test('should validate application exists', async () => {
            const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            const interviewData = {
                application_id: '00000000-0000-0000-0000-000000000000',
                scheduled_at: futureDate.toISOString(),
                mode: 'online'
            };

            const response = await request(app)
                .post('/api/v1/interviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(interviewData);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Application not found');
        });
    });

    describe('GET /api/v1/interviews - List Interviews', () => {
        test('should allow admin to view all interviews', async () => {
            const response = await request(app)
                .get('/api/v1/interviews')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('interviews');
            expect(response.body).toHaveProperty('total');
            expect(Array.isArray(response.body.interviews)).toBe(true);
        });

        test('should allow recruiter to view interviews', async () => {
            const response = await request(app)
                .get('/api/v1/interviews')
                .set('Authorization', `Bearer ${recruiterToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('interviews');
        });

        test('should allow student to view only their interviews', async () => {
            const response = await request(app)
                .get('/api/v1/interviews')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('interviews');
            
            // All interviews should belong to the student
            response.body.interviews.forEach(interview => {
                expect(interview.student_id).toBe(studentUser.id);
            });
        });

        test('should support filtering by status', async () => {
            const response = await request(app)
                .get('/api/v1/interviews?status=scheduled')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            response.body.interviews.forEach(interview => {
                expect(interview.status).toBe('scheduled');
            });
        });

        test('should support filtering by mode', async () => {
            const response = await request(app)
                .get('/api/v1/interviews?mode=online')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            response.body.interviews.forEach(interview => {
                expect(interview.mode).toBe('online');
            });
        });
    });

    describe('GET /api/v1/interviews/:id - Get Interview by ID', () => {
        let testInterview;

        beforeAll(async () => {
            // Create a test interview for these tests
            const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
            const result = await pool.query(`
                INSERT INTO interviews (application_id, company_id, student_id, scheduled_at, mode, status)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [testApplication.id, testCompany.id, studentUser.id, futureDate, 'online', 'scheduled']);
            testInterview = result.rows[0];
        });

        test('should allow admin to view any interview', async () => {
            const response = await request(app)
                .get(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.interview.id).toBe(testInterview.id);
        });

        test('should allow recruiter to view any interview', async () => {
            const response = await request(app)
                .get(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${recruiterToken}`);

            expect(response.status).toBe(200);
            expect(response.body.interview.id).toBe(testInterview.id);
        });

        test('should allow student to view their own interview', async () => {
            const response = await request(app)
                .get(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.interview.id).toBe(testInterview.id);
        });

        test('should not allow student to view other students interview', async () => {
            const response = await request(app)
                .get(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${student2Token}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('Access denied');
        });

        test('should return 404 for non-existent interview', async () => {
            const response = await request(app)
                .get('/api/v1/interviews/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Interview not found');
        });
    });

    describe('PUT /api/v1/interviews/:id - Update Interview', () => {
        let testInterview;

        beforeAll(async () => {
            // Create a test interview for these tests
            const futureDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
            const result = await pool.query(`
                INSERT INTO interviews (application_id, company_id, student_id, scheduled_at, mode, status)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [testApplication2.id, testCompany.id, student2User.id, futureDate, 'online', 'scheduled']);
            testInterview = result.rows[0];
        });

        test('should allow admin to update interview', async () => {
            const updateData = {
                status: 'completed',
                feedback: 'Good interview performance'
            };

            const response = await request(app)
                .put(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Interview updated successfully');
            expect(response.body.interview.status).toBe('completed');
            expect(response.body.interview.feedback).toBe('Good interview performance');
        });

        test('should allow recruiter to update interview', async () => {
            const updateData = {
                mode: 'offline'
            };

            const response = await request(app)
                .put(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${recruiterToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.interview.mode).toBe('offline');
        });

        test('should not allow student to update interview', async () => {
            const updateData = {
                status: 'cancelled'
            };

            const response = await request(app)
                .put(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(updateData);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Insufficient permissions');
        });

        test('should validate future date when updating scheduled_at', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const updateData = {
                scheduled_at: pastDate.toISOString()
            };

            const response = await request(app)
                .put(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('future date');
        });

        test('should validate mode enum when updating', async () => {
            const updateData = {
                mode: 'invalid_mode'
            };

            const response = await request(app)
                .put(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid mode');
        });

        test('should validate status enum when updating', async () => {
            const updateData = {
                status: 'invalid_status'
            };

            const response = await request(app)
                .put(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Invalid status');
        });

        test('should return 404 for non-existent interview', async () => {
            const response = await request(app)
                .put('/api/v1/interviews/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'completed' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Interview not found');
        });
    });

    describe('DELETE /api/v1/interviews/:id - Delete Interview', () => {
        let testInterview;

        beforeAll(async () => {
            // Create a test interview for deletion
            const futureDate = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
            const result = await pool.query(`
                INSERT INTO interviews (application_id, company_id, student_id, scheduled_at, mode, status)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [testApplication.id, testCompany.id, studentUser.id, futureDate, 'online', 'scheduled']);
            testInterview = result.rows[0];
        });

        test('should allow admin to delete interview', async () => {
            const response = await request(app)
                .delete(`/api/v1/interviews/${testInterview.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Interview deleted successfully');
        });

        test('should not allow recruiter to delete interview', async () => {
            // Create another interview for this test
            const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const result = await pool.query(`
                INSERT INTO interviews (application_id, company_id, student_id, scheduled_at, mode, status)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [testApplication2.id, testCompany.id, student2User.id, futureDate, 'online', 'scheduled']);
            const interviewToDelete = result.rows[0];

            const response = await request(app)
                .delete(`/api/v1/interviews/${interviewToDelete.id}`)
                .set('Authorization', `Bearer ${recruiterToken}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Insufficient permissions');
        });

        test('should not allow student to delete interview', async () => {
            // Create another interview for this test
            const futureDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
            const result = await pool.query(`
                INSERT INTO interviews (application_id, company_id, student_id, scheduled_at, mode, status)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [testApplication.id, testCompany.id, studentUser.id, futureDate, 'online', 'scheduled']);
            const interviewToDelete = result.rows[0];

            const response = await request(app)
                .delete(`/api/v1/interviews/${interviewToDelete.id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Insufficient permissions');
        });

        test('should return 404 for non-existent interview', async () => {
            const response = await request(app)
                .delete('/api/v1/interviews/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Interview not found');
        });
    });

    describe('Cascade Delete Tests', () => {
        test('should delete interview when application is deleted', async () => {
            // Create a new job to avoid unique constraint violation
            const newJobResult = await pool.query(`
                INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
                VALUES ($1, $2, $3, $4, $5) RETURNING *
            `, [
                testCompany.id,
                'Cascade Test Job',
                'Job for cascade delete test',
                'All students',
                new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
            ]);
            const newJob = newJobResult.rows[0];

            // Create a test application and interview
            const applicationResult = await pool.query(`
                INSERT INTO applications (student_id, job_id, status) 
                VALUES ($1, $2, $3) RETURNING *
            `, [studentUser.id, newJob.id, 'applied']);
            const testApp = applicationResult.rows[0];

            const futureDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);
            const interviewResult = await pool.query(`
                INSERT INTO interviews (application_id, company_id, student_id, scheduled_at, mode, status)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [testApp.id, testCompany.id, studentUser.id, futureDate, 'online', 'scheduled']);
            const testInt = interviewResult.rows[0];

            // Delete the application
            await pool.query('DELETE FROM applications WHERE id = $1', [testApp.id]);

            // Check that interview was also deleted
            const interviewCheck = await pool.query('SELECT * FROM interviews WHERE id = $1', [testInt.id]);
            expect(interviewCheck.rows.length).toBe(0);

            // Clean up the test job
            await pool.query('DELETE FROM jobs WHERE id = $1', [newJob.id]);
        });
    });
});
