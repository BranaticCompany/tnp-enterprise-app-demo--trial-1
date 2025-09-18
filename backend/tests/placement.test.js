const request = require('supertest');
const { app } = require('../index');
const pool = require('../src/utils/database');
const jwt = require('jsonwebtoken');

describe('Placement Management', () => {
    let adminToken, recruiterToken, studentToken, student2Token;
    let adminUser, recruiterUser, studentUser, student2User;
    let testCompany, testJob, testJob2;

    beforeAll(async () => {
        // Clean up existing test data
        await pool.query('DELETE FROM placements WHERE 1=1');
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

        // Create test jobs
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

        const job2Result = await pool.query(
            `INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
                testCompany.id,
                'Data Analyst',
                'Another test job',
                'All students',
                new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
            ]
        );
        testJob2 = job2Result.rows[0];
    });

    afterAll(async () => {
        // Clean up test data
        await pool.query('DELETE FROM placements WHERE 1=1');
        await pool.query('DELETE FROM jobs WHERE 1=1');
        await pool.query('DELETE FROM companies WHERE 1=1');
        await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
    });

    describe('Authentication and Authorization', () => {
        test('should require authentication for all endpoints', async () => {
            const endpoints = [
                { method: 'get', path: '/api/v1/placements' },
                { method: 'post', path: '/api/v1/placements' },
                { method: 'get', path: '/api/v1/placements/123' },
                { method: 'put', path: '/api/v1/placements/123' },
                { method: 'delete', path: '/api/v1/placements/123' }
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)[endpoint.method](endpoint.path);
                expect(response.status).toBe(401);
                expect(response.body.error).toBe('Access token required');
            }
        });

        test('should reject invalid tokens', async () => {
            const response = await request(app)
                .get('/api/v1/placements')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Invalid token');
        });
    });

    describe('POST /api/v1/placements - Create Placement', () => {
        test('should allow admin to create placement', async () => {
            const placementData = {
                student_id: studentUser.id,
                job_id: testJob.id,
                company_id: testCompany.id,
                package: 1200000,
                role: 'Software Engineer',
                status: 'offered'
            };

            const response = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(placementData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Placement created successfully');
            expect(response.body.placement.student_id).toBe(studentUser.id);
            expect(response.body.placement.job_id).toBe(testJob.id);
            expect(response.body.placement.package).toBe('1200000.00');
            expect(response.body.placement.role).toBe('Software Engineer');
            expect(response.body.placement.status).toBe('offered');
        });

        test('should prevent non-admin users from creating placements', async () => {
            const placementData = {
                student_id: student2User.id,
                job_id: testJob2.id,
                company_id: testCompany.id,
                package: 1000000,
                role: 'Data Analyst'
            };

            // Test student access
            const studentResponse = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${studentToken}`)
                .send(placementData);

            expect(studentResponse.status).toBe(403);
            expect(studentResponse.body.error).toBe('Insufficient permissions');

            // Test recruiter access
            const recruiterResponse = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${recruiterToken}`)
                .send(placementData);

            expect(recruiterResponse.status).toBe(403);
            expect(recruiterResponse.body.error).toBe('Insufficient permissions');
        });

        test('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing required fields');
        });

        test('should validate student exists and has student role', async () => {
            const response = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    student_id: adminUser.id, // Admin user, not student
                    job_id: testJob.id,
                    company_id: testCompany.id,
                    role: 'Test Role'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('User must be a student');
        });

        test('should validate job exists', async () => {
            const fakeJobId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    student_id: studentUser.id,
                    job_id: fakeJobId,
                    company_id: testCompany.id,
                    role: 'Test Role'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Job not found');
        });

        test('should validate company matches job company', async () => {
            // Create another company
            const anotherCompany = await pool.query(
                `INSERT INTO companies (name, description) 
                 VALUES ($1, $2) RETURNING *`,
                ['Another Company', 'Another test company']
            );

            const response = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    student_id: studentUser.id,
                    job_id: testJob.id,
                    company_id: anotherCompany.rows[0].id, // Different company
                    role: 'Test Role'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Company ID must match the job\'s company');

            // Clean up
            await pool.query('DELETE FROM companies WHERE id = $1', [anotherCompany.rows[0].id]);
        });

        test('should prevent duplicate placements', async () => {
            // First create a placement
            await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    student_id: studentUser.id,
                    job_id: testJob.id,
                    company_id: testCompany.id,
                    package: 1200000,
                    role: 'Software Engineer',
                    status: 'offered'
                });

            // Try to create duplicate
            const placementData = {
                student_id: studentUser.id,
                job_id: testJob.id, // Same job as first placement
                company_id: testCompany.id,
                role: 'Another Role'
            };

            const response = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(placementData);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Placement already exists for this student-job combination');
        });

        test('should validate package is positive number', async () => {
            const response = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    student_id: student2User.id,
                    job_id: testJob2.id,
                    company_id: testCompany.id,
                    package: -100000, // Negative package
                    role: 'Test Role'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Package must be a positive number');
        });

        test('should validate status enum', async () => {
            const response = await request(app)
                .post('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    student_id: student2User.id,
                    job_id: testJob2.id,
                    company_id: testCompany.id,
                    role: 'Test Role',
                    status: 'invalid_status'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid status. Must be one of: offered, accepted, joined, declined');
        });
    });

    describe('GET /api/v1/placements - List Placements', () => {
        beforeEach(async () => {
            // Clean existing placements first
            await pool.query('DELETE FROM placements WHERE 1=1');
            // Create placements for both students
            await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, package, role, status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [studentUser.id, testJob.id, testCompany.id, 1200000, 'Software Engineer', 'offered']
            );
            await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, package, role, status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [student2User.id, testJob2.id, testCompany.id, 1000000, 'Data Analyst', 'accepted']
            );
        });

        test('should allow admin to view all placements', async () => {
            const response = await request(app)
                .get('/api/v1/placements')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.placements).toHaveLength(2);
            expect(response.body.total).toBe(2);
        });

        test('should allow recruiter to view all placements', async () => {
            const response = await request(app)
                .get('/api/v1/placements')
                .set('Authorization', `Bearer ${recruiterToken}`);

            expect(response.status).toBe(200);
            expect(response.body.placements).toHaveLength(2);
        });

        test('should allow student to view only their placements', async () => {
            const response = await request(app)
                .get('/api/v1/placements')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.placements).toHaveLength(1);
            expect(response.body.placements[0].student_id).toBe(studentUser.id);
        });

        test('should support filtering by status', async () => {
            const response = await request(app)
                .get('/api/v1/placements?status=accepted')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.placements).toHaveLength(1);
            expect(response.body.placements[0].status).toBe('accepted');
        });

        test('should support filtering by company', async () => {
            const response = await request(app)
                .get(`/api/v1/placements?company_id=${testCompany.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.placements).toHaveLength(2);
        });
    });

    describe('GET /api/v1/placements/:id - Get Placement by ID', () => {
        let placementId;

        beforeEach(async () => {
            // Clean existing placements first
            await pool.query('DELETE FROM placements WHERE 1=1');
            // Create placements for both students
            const result = await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, package, role, status)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [studentUser.id, testJob.id, testCompany.id, 1200000, 'Software Engineer', 'offered']
            );
            placementId = result.rows[0].id;
            await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, package, role, status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [student2User.id, testJob2.id, testCompany.id, 1000000, 'Data Analyst', 'accepted']
            );
        });

        test('should allow admin to view any placement', async () => {
            const response = await request(app)
                .get(`/api/v1/placements/${placementId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.placement.id).toBe(placementId);
            expect(response.body.placement.student_email).toBe(studentUser.email);
        });

        test('should allow recruiter to view any placement', async () => {
            const response = await request(app)
                .get(`/api/v1/placements/${placementId}`)
                .set('Authorization', `Bearer ${recruiterToken}`);

            expect(response.status).toBe(200);
            expect(response.body.placement.id).toBe(placementId);
        });

        test('should allow student to view their own placement', async () => {
            const response = await request(app)
                .get(`/api/v1/placements/${placementId}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.placement.id).toBe(placementId);
        });

        test('should prevent student from viewing other students placements', async () => {
            const response = await request(app)
                .get(`/api/v1/placements/${placementId}`)
                .set('Authorization', `Bearer ${student2Token}`);

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied. Students can only view their own placements');
        });

        test('should return 404 for non-existent placement', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .get(`/api/v1/placements/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Placement not found');
        });
    });

    describe('PUT /api/v1/placements/:id - Update Placement', () => {
        let placementId;

        beforeEach(async () => {
            // Clean existing placements first
            await pool.query('DELETE FROM placements WHERE 1=1');
            // Create a placement for testing updates
            const result = await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, package, role, status)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [studentUser.id, testJob.id, testCompany.id, 1200000, 'Software Engineer', 'offered']
            );
            placementId = result.rows[0].id;
        });

        test('should allow admin to update placement', async () => {
            const updateData = {
                package: 1500000,
                role: 'Senior Software Engineer',
                status: 'accepted'
            };

            const response = await request(app)
                .put(`/api/v1/placements/${placementId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Placement updated successfully');
            expect(response.body.placement.package).toBe('1500000.00');
            expect(response.body.placement.role).toBe('Senior Software Engineer');
            expect(response.body.placement.status).toBe('accepted');
        });

        test('should prevent non-admin users from updating placements', async () => {
            const updateData = { status: 'declined' };

            // Test student access
            const studentResponse = await request(app)
                .put(`/api/v1/placements/${placementId}`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send(updateData);

            expect(studentResponse.status).toBe(403);

            // Test recruiter access
            const recruiterResponse = await request(app)
                .put(`/api/v1/placements/${placementId}`)
                .set('Authorization', `Bearer ${recruiterToken}`)
                .send(updateData);

            expect(recruiterResponse.status).toBe(403);
        });

        test('should validate update data', async () => {
            const response = await request(app)
                .put(`/api/v1/placements/${placementId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ package: -50000 });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Package must be a positive number or null');
        });

        test('should return 404 for non-existent placement', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .put(`/api/v1/placements/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'declined' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Placement not found');
        });
    });

    describe('DELETE /api/v1/placements/:id - Delete Placement', () => {
        let placementToDelete;

        beforeEach(async () => {
            // Clean existing placements first
            await pool.query('DELETE FROM placements WHERE 1=1');
            // Create a specific placement for deletion testing
            const result = await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, role, status)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [student2User.id, testJob2.id, testCompany.id, 'Role for Deletion', 'offered']
            );
            placementToDelete = result.rows[0];
        });

        test('should allow admin to delete placement', async () => {
            const response = await request(app)
                .delete(`/api/v1/placements/${placementToDelete.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Placement deleted successfully');
            expect(response.body.placement.id).toBe(placementToDelete.id);
        });

        test('should prevent non-admin users from deleting placements', async () => {
            // Create a new job and placement for testing to avoid duplicate key
            const newJob = await pool.query(
                `INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [
                    testCompany.id,
                    'Delete Test Job',
                    'Job for delete testing',
                    'All students',
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                ]
            );
            
            const testPlacement = await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, role, status)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [studentUser.id, newJob.rows[0].id, testCompany.id, 'Another Test Role', 'offered']
            );

            // Test student access
            const studentResponse = await request(app)
                .delete(`/api/v1/placements/${testPlacement.rows[0].id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(studentResponse.status).toBe(403);

            // Test recruiter access
            const recruiterResponse = await request(app)
                .delete(`/api/v1/placements/${testPlacement.rows[0].id}`)
                .set('Authorization', `Bearer ${recruiterToken}`);

            expect(recruiterResponse.status).toBe(403);

            // Clean up
            await pool.query('DELETE FROM placements WHERE id = $1', [testPlacement.rows[0].id]);
            await pool.query('DELETE FROM jobs WHERE id = $1', [newJob.rows[0].id]);
        });

        test('should return 404 for non-existent placement', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';
            const response = await request(app)
                .delete(`/api/v1/placements/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Placement not found');
        });
    });

    describe('Data Integrity and Cascade Deletes', () => {
        test('should cascade delete placements when student is deleted', async () => {
            // Create a test student and placement
            const testStudent = await pool.query(
                `INSERT INTO users (email, password_hash, role) 
                 VALUES ($1, $2, $3) RETURNING *`,
                ['cascade-test@test.com', 'hashedpassword', 'student']
            );

            const testPlacement = await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, role, status)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [testStudent.rows[0].id, testJob.id, testCompany.id, 'Cascade Test Role', 'offered']
            );

            // Delete the student
            await pool.query('DELETE FROM users WHERE id = $1', [testStudent.rows[0].id]);

            // Verify placement is also deleted
            const placementCheck = await pool.query(
                'SELECT * FROM placements WHERE id = $1',
                [testPlacement.rows[0].id]
            );

            expect(placementCheck.rows).toHaveLength(0);
        });

        test('should cascade delete placements when job is deleted', async () => {
            // Create a test job and placement
            const testJob = await pool.query(
                `INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [
                    testCompany.id,
                    'Cascade Test Job',
                    'Job for cascade testing',
                    'All students',
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                ]
            );

            const testPlacement = await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, role, status)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [studentUser.id, testJob.rows[0].id, testCompany.id, 'Job Cascade Test', 'offered']
            );

            // Delete the job
            await pool.query('DELETE FROM jobs WHERE id = $1', [testJob.rows[0].id]);

            // Verify placement is also deleted
            const placementCheck = await pool.query(
                'SELECT * FROM placements WHERE id = $1',
                [testPlacement.rows[0].id]
            );

            expect(placementCheck.rows).toHaveLength(0);
        });

        test('should cascade delete placements when company is deleted', async () => {
            // Create a test company, job, and placement
            const testCompany = await pool.query(
                `INSERT INTO companies (name, description) 
                 VALUES ($1, $2) RETURNING *`,
                ['Cascade Test Company', 'Company for cascade testing']
            );

            const testJob = await pool.query(
                `INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [
                    testCompany.rows[0].id,
                    'Company Cascade Job',
                    'Job for company cascade testing',
                    'All students',
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                ]
            );

            const testPlacement = await pool.query(
                `INSERT INTO placements (student_id, job_id, company_id, role, status)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [studentUser.id, testJob.rows[0].id, testCompany.rows[0].id, 'Company Cascade Test', 'offered']
            );

            // Delete the company (should cascade to jobs and then to placements)
            await pool.query('DELETE FROM companies WHERE id = $1', [testCompany.rows[0].id]);

            // Verify placement is also deleted
            const placementCheck = await pool.query(
                'SELECT * FROM placements WHERE id = $1',
                [testPlacement.rows[0].id]
            );

            expect(placementCheck.rows).toHaveLength(0);
        });
    });
});
