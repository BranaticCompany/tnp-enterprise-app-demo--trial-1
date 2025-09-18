const request = require('supertest');
const { app } = require('../index');
const pool = require('../src/utils/database');
const jwt = require('jsonwebtoken');

describe('Reports & Analytics', () => {
    let adminToken, recruiterToken, studentToken, student2Token;
    let adminUser, recruiterUser, studentUser, student2User;
    let testCompany1, testCompany2, testJob1, testJob2, testJob3;
    let testApplication1, testApplication2, testApplication3, testApplication4;
    let testInterview1, testInterview2, testPlacement1, testPlacement2;

    beforeAll(async () => {
        // Clean up existing test data
        await pool.query('DELETE FROM placements WHERE 1=1');
        await pool.query('DELETE FROM interviews WHERE 1=1');
        await pool.query('DELETE FROM applications WHERE 1=1');
        await pool.query('DELETE FROM jobs WHERE 1=1');
        await pool.query('DELETE FROM companies WHERE 1=1');
        await pool.query('DELETE FROM profiles WHERE 1=1');
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

        // Create profiles for students
        await pool.query(
            `INSERT INTO profiles (user_id, full_name, phone, branch, year_of_study) 
             VALUES ($1, $2, $3, $4, $5)`,
            [studentUser.id, 'Test Student 1', '1234567890', 'Computer Science', 4]
        );

        await pool.query(
            `INSERT INTO profiles (user_id, full_name, phone, branch, year_of_study) 
             VALUES ($1, $2, $3, $4, $5)`,
            [student2User.id, 'Test Student 2', '0987654321', 'Electronics', 3]
        );

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

        // Create test companies
        const company1Result = await pool.query(
            `INSERT INTO companies (name, description, website) 
             VALUES ($1, $2, $3) RETURNING *`,
            ['TechCorp Inc', 'Leading tech company', 'https://techcorp.com']
        );
        testCompany1 = company1Result.rows[0];

        const company2Result = await pool.query(
            `INSERT INTO companies (name, description, website) 
             VALUES ($1, $2, $3) RETURNING *`,
            ['DataSoft Ltd', 'Data analytics company', 'https://datasoft.com']
        );
        testCompany2 = company2Result.rows[0];

        // Create test jobs
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const job1Result = await pool.query(
            `INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [testCompany1.id, 'Software Engineer', 'Full stack developer role', 'CS/IT students', futureDate]
        );
        testJob1 = job1Result.rows[0];

        const job2Result = await pool.query(
            `INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [testCompany1.id, 'Data Scientist', 'ML/AI role', 'CS/IT/Math students', futureDate]
        );
        testJob2 = job2Result.rows[0];

        const job3Result = await pool.query(
            `INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [testCompany2.id, 'Analytics Engineer', 'Data analytics role', 'All branches', futureDate]
        );
        testJob3 = job3Result.rows[0];

        // Create test applications
        const app1Result = await pool.query(
            `INSERT INTO applications (student_id, job_id, status) 
             VALUES ($1, $2, $3) RETURNING *`,
            [studentUser.id, testJob1.id, 'shortlisted']
        );
        testApplication1 = app1Result.rows[0];

        const app2Result = await pool.query(
            `INSERT INTO applications (student_id, job_id, status) 
             VALUES ($1, $2, $3) RETURNING *`,
            [studentUser.id, testJob2.id, 'applied']
        );
        testApplication2 = app2Result.rows[0];

        const app3Result = await pool.query(
            `INSERT INTO applications (student_id, job_id, status) 
             VALUES ($1, $2, $3) RETURNING *`,
            [student2User.id, testJob1.id, 'hired']
        );
        testApplication3 = app3Result.rows[0];

        const app4Result = await pool.query(
            `INSERT INTO applications (student_id, job_id, status) 
             VALUES ($1, $2, $3) RETURNING *`,
            [student2User.id, testJob3.id, 'rejected']
        );
        testApplication4 = app4Result.rows[0];

        // Create test interviews
        const futureInterview = new Date();
        futureInterview.setDate(futureInterview.getDate() + 7);

        const pastInterview = new Date();
        pastInterview.setDate(pastInterview.getDate() + 1); // Make it future but close

        const interview1Result = await pool.query(
            `INSERT INTO interviews (application_id, student_id, company_id, scheduled_at, mode, status, feedback) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [testApplication1.id, studentUser.id, testCompany1.id, pastInterview, 'online', 'completed', 'Good performance']
        );
        testInterview1 = interview1Result.rows[0];

        const interview2Result = await pool.query(
            `INSERT INTO interviews (application_id, student_id, company_id, scheduled_at, mode, status) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [testApplication3.id, student2User.id, testCompany1.id, futureInterview, 'offline', 'scheduled']
        );
        testInterview2 = interview2Result.rows[0];

        // Create test placements
        const placement1Result = await pool.query(
            `INSERT INTO placements (student_id, job_id, company_id, package, role, status) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [studentUser.id, testJob1.id, testCompany1.id, 800000, 'Software Engineer', 'accepted']
        );
        testPlacement1 = placement1Result.rows[0];

        const placement2Result = await pool.query(
            `INSERT INTO placements (student_id, job_id, company_id, package, role, status) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [student2User.id, testJob1.id, testCompany1.id, 1200000, 'Senior Software Engineer', 'joined']
        );
        testPlacement2 = placement2Result.rows[0];
    });

    afterAll(async () => {
        // Clean up test data
        await pool.query('DELETE FROM placements WHERE 1=1');
        await pool.query('DELETE FROM interviews WHERE 1=1');
        await pool.query('DELETE FROM applications WHERE 1=1');
        await pool.query('DELETE FROM jobs WHERE 1=1');
        await pool.query('DELETE FROM companies WHERE 1=1');
        await pool.query('DELETE FROM profiles WHERE 1=1');
        await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
        // Note: pool.end() is not needed in Jest tests as the pool is managed globally
    });

    describe('Authentication & Authorization', () => {
        test('should require authentication for all report endpoints', async () => {
            const endpoints = [
                '/api/v1/reports/applications',
                '/api/v1/reports/interviews',
                '/api/v1/reports/placements',
                '/api/v1/reports/students',
                '/api/v1/reports/me'
            ];

            for (const endpoint of endpoints) {
                const response = await request(app).get(endpoint);
                expect(response.status).toBe(401);
                expect(response.body.error).toBe('Access token required');
            }
        });

        test('should deny student access to admin/recruiter reports', async () => {
            const adminEndpoints = [
                '/api/v1/reports/applications',
                '/api/v1/reports/interviews',
                '/api/v1/reports/placements',
                '/api/v1/reports/students'
            ];

            for (const endpoint of adminEndpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${studentToken}`);
                expect(response.status).toBe(403);
                expect(response.body.error).toBe('Insufficient permissions');
            }
        });

        test('should allow admin access to all reports', async () => {
            const endpoints = [
                '/api/v1/reports/applications',
                '/api/v1/reports/interviews',
                '/api/v1/reports/placements',
                '/api/v1/reports/students',
                '/api/v1/reports/me'
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${adminToken}`);
                expect(response.status).toBe(200);
            }
        });

        test('should allow recruiter access to admin reports', async () => {
            const endpoints = [
                '/api/v1/reports/applications',
                '/api/v1/reports/interviews',
                '/api/v1/reports/placements',
                '/api/v1/reports/students'
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('Authorization', `Bearer ${recruiterToken}`);
                expect(response.status).toBe(200);
            }
        });
    });

    describe('Applications Report', () => {
        test('should return applications statistics by company', async () => {
            const response = await request(app)
                .get('/api/v1/reports/applications')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('overall_statistics');
            expect(response.body).toHaveProperty('applications_by_company');

            const overallStats = response.body.overall_statistics;
            expect(parseInt(overallStats.total_companies)).toBeGreaterThanOrEqual(2);
            expect(parseInt(overallStats.total_jobs)).toBeGreaterThanOrEqual(3);
            expect(parseInt(overallStats.total_applications)).toBeGreaterThanOrEqual(4);

            const companyStats = response.body.applications_by_company;
            expect(Array.isArray(companyStats)).toBe(true);
            expect(companyStats.length).toBeGreaterThan(0);

            // Check if TechCorp Inc has correct stats
            const techCorpStats = companyStats.filter(stat => stat.company_name === 'TechCorp Inc');
            expect(techCorpStats.length).toBeGreaterThan(0);
        });
    });

    describe('Interviews Report', () => {
        test('should return interview statistics', async () => {
            const response = await request(app)
                .get('/api/v1/reports/interviews')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('overall_statistics');
            expect(response.body).toHaveProperty('interviews_by_company');
            expect(response.body).toHaveProperty('recent_trends');

            const overallStats = response.body.overall_statistics;
            expect(parseInt(overallStats.total_interviews)).toBeGreaterThanOrEqual(2);
            expect(parseInt(overallStats.completed_count)).toBeGreaterThanOrEqual(1);
            expect(parseInt(overallStats.scheduled_count)).toBeGreaterThanOrEqual(1);
            expect(parseInt(overallStats.online_count)).toBeGreaterThanOrEqual(1);
            expect(parseInt(overallStats.offline_count)).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Placements Report', () => {
        test('should return placement statistics', async () => {
            const response = await request(app)
                .get('/api/v1/reports/placements')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('overall_statistics');
            expect(response.body).toHaveProperty('placements_by_company');
            expect(response.body).toHaveProperty('package_distribution');

            const overallStats = response.body.overall_statistics;
            expect(parseInt(overallStats.total_placements)).toBeGreaterThanOrEqual(2);
            expect(parseInt(overallStats.accepted_count)).toBeGreaterThanOrEqual(1);
            expect(parseInt(overallStats.joined_count)).toBeGreaterThanOrEqual(1);
            expect(parseFloat(overallStats.average_package)).toBeGreaterThan(0);
            expect(parseFloat(overallStats.highest_package)).toBeGreaterThanOrEqual(1200000);
        });
    });

    describe('Students Report', () => {
        test('should return student activity statistics', async () => {
            const response = await request(app)
                .get('/api/v1/reports/students')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('overall_statistics');
            expect(response.body).toHaveProperty('activity_by_branch');
            expect(response.body).toHaveProperty('activity_by_year');

            const overallStats = response.body.overall_statistics;
            expect(parseInt(overallStats.total_students)).toBeGreaterThanOrEqual(2);
            expect(parseInt(overallStats.students_with_profiles)).toBeGreaterThanOrEqual(2);
            expect(parseInt(overallStats.students_who_applied)).toBeGreaterThanOrEqual(2);
            expect(parseInt(overallStats.students_interviewed)).toBeGreaterThanOrEqual(2);
            expect(parseInt(overallStats.students_placed)).toBeGreaterThanOrEqual(2);

            const branchStats = response.body.activity_by_branch;
            expect(Array.isArray(branchStats)).toBe(true);
            expect(branchStats.length).toBeGreaterThan(0);

            // Check if Computer Science branch exists
            const csStats = branchStats.find(stat => stat.branch === 'Computer Science');
            expect(csStats).toBeDefined();
            expect(parseInt(csStats.total_students)).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Student Personal Report', () => {
        test('should return student\'s own summary', async () => {
            const response = await request(app)
                .get('/api/v1/reports/me')
                .set('Authorization', `Bearer ${studentToken}`);

            if (response.status !== 200) {
                console.log('Error response:', response.body);
            }
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('applications');
            expect(response.body).toHaveProperty('interviews');
            expect(response.body).toHaveProperty('placements');
            expect(response.body).toHaveProperty('recent_activity');

            const applications = response.body.applications;
            expect(parseInt(applications.total_applications)).toBeGreaterThanOrEqual(2);
            expect(parseInt(applications.shortlisted_count)).toBeGreaterThanOrEqual(1);
            expect(parseInt(applications.applied_count)).toBeGreaterThanOrEqual(1);

            const interviews = response.body.interviews;
            expect(parseInt(interviews.total_interviews)).toBeGreaterThanOrEqual(1);
            expect(parseInt(interviews.completed_count)).toBeGreaterThanOrEqual(1);

            const placements = response.body.placements;
            expect(parseInt(placements.total_placements)).toBeGreaterThanOrEqual(1);
            expect(parseInt(placements.accepted_count)).toBeGreaterThanOrEqual(1);

            const recentActivity = response.body.recent_activity;
            expect(Array.isArray(recentActivity)).toBe(true);
        });

        test('should return different data for different students', async () => {
            const student1Response = await request(app)
                .get('/api/v1/reports/me')
                .set('Authorization', `Bearer ${studentToken}`);

            const student2Response = await request(app)
                .get('/api/v1/reports/me')
                .set('Authorization', `Bearer ${student2Token}`);

            expect(student1Response.status).toBe(200);
            expect(student2Response.status).toBe(200);

            // Students should have different application counts or statuses
            const student1Apps = student1Response.body.applications;
            const student2Apps = student2Response.body.applications;

            // At least one metric should be different
            const metricsMatch = (
                student1Apps.total_applications === student2Apps.total_applications &&
                student1Apps.shortlisted_count === student2Apps.shortlisted_count &&
                student1Apps.hired_count === student2Apps.hired_count &&
                student1Apps.rejected_count === student2Apps.rejected_count
            );
            expect(metricsMatch).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty data gracefully', async () => {
            // Create a new student with no activity
            const emptyStudentResult = await pool.query(
                `INSERT INTO users (email, password_hash, role) 
                 VALUES ($1, $2, $3) RETURNING *`,
                ['emptystudent@test.com', 'hashedpassword', 'student']
            );
            const emptyStudentUser = emptyStudentResult.rows[0];

            const emptyStudentToken = jwt.sign(
                { id: emptyStudentUser.id, email: emptyStudentUser.email, role: emptyStudentUser.role },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .get('/api/v1/reports/me')
                .set('Authorization', `Bearer ${emptyStudentToken}`);

            expect(response.status).toBe(200);
            expect(response.body.applications.total_applications).toBe('0');
            expect(response.body.interviews.total_interviews).toBe('0');
            expect(response.body.placements.total_placements).toBe('0');
            expect(response.body.recent_activity).toEqual([]);

            // Clean up
            await pool.query('DELETE FROM users WHERE id = $1', [emptyStudentUser.id]);
        });

        test('should return consistent data structure even with no data', async () => {
            // Temporarily clear all data
            await pool.query('DELETE FROM placements WHERE 1=1');
            await pool.query('DELETE FROM interviews WHERE 1=1');
            await pool.query('DELETE FROM applications WHERE 1=1');

            const response = await request(app)
                .get('/api/v1/reports/applications')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('overall_statistics');
            expect(response.body).toHaveProperty('applications_by_company');
            expect(Array.isArray(response.body.applications_by_company)).toBe(true);

            // Restore test data for other tests
            await pool.query(
                `INSERT INTO applications (student_id, job_id, status) 
                 VALUES ($1, $2, $3), ($1, $4, $5), ($6, $2, $7), ($6, $8, $9)`,
                [studentUser.id, testJob1.id, 'shortlisted', testJob2.id, 'applied', 
                 student2User.id, 'hired', testJob3.id, 'rejected']
            );
        });
    });
});
