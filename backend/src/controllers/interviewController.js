const pool = require('../utils/database');

// Create a new interview (Admin/Recruiter only)
const createInterview = async (req, res) => {
    try {
        const { application_id, scheduled_at, mode = 'online', status = 'scheduled', feedback } = req.body;

        // Validate required fields
        if (!application_id || !scheduled_at) {
            return res.status(400).json({
                error: 'Missing required fields: application_id and scheduled_at are required'
            });
        }

        // Validate mode enum
        const validModes = ['online', 'offline'];
        if (!validModes.includes(mode)) {
            return res.status(400).json({
                error: 'Invalid mode. Must be one of: online, offline'
            });
        }

        // Validate status enum
        const validStatuses = ['scheduled', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be one of: scheduled, completed, cancelled'
            });
        }

        // Validate scheduled_at is in the future
        const scheduledDate = new Date(scheduled_at);
        const now = new Date();
        if (scheduledDate <= now) {
            return res.status(400).json({
                error: 'Interview must be scheduled for a future date and time'
            });
        }

        // Check if application exists and get related data
        const applicationCheck = await pool.query(`
            SELECT 
                a.id, a.student_id, 
                j.company_id,
                u.email as student_email,
                c.name as company_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN companies c ON j.company_id = c.id
            JOIN users u ON a.student_id = u.id
            WHERE a.id = $1
        `, [application_id]);

        if (applicationCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const application = applicationCheck.rows[0];

        // Check for duplicate interview for this application
        const duplicateCheck = await pool.query(
            'SELECT id FROM interviews WHERE application_id = $1',
            [application_id]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Interview already exists for this application' 
            });
        }

        // Create the interview
        const result = await pool.query(`
            INSERT INTO interviews (application_id, company_id, student_id, scheduled_at, mode, status, feedback)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [application_id, application.company_id, application.student_id, scheduled_at, mode, status, feedback]);

        res.status(201).json({
            message: 'Interview scheduled successfully',
            interview: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating interview:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ 
                error: 'Interview already exists for this application' 
            });
        }
        if (error.code === '23514') { // Check constraint violation (future date)
            return res.status(400).json({
                error: 'Interview must be scheduled for a future date and time'
            });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all interviews with role-based filtering
const getInterviews = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { status, company_id, student_id, mode } = req.query;

        let query = `
            SELECT 
                i.*,
                u.email as student_email,
                j.title as job_title,
                j.description as job_description,
                j.package as job_package,
                j.type as job_type,
                c.name as company_name,
                c.website as company_website,
                a.status as application_status
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN companies c ON i.company_id = c.id
            JOIN users u ON i.student_id = u.id
        `;

        const queryParams = [];
        const conditions = [];

        // Role-based filtering
        if (role === 'student') {
            conditions.push('i.student_id = $' + (queryParams.length + 1));
            queryParams.push(userId);
        } else if (role === 'recruiter') {
            // Recruiters can see interviews for their company's jobs
            // For now, allowing all interviews - can be refined based on recruiter-company association
        }
        // Admins can see all interviews (no additional filtering)

        // Additional filters
        if (status) {
            conditions.push('i.status = $' + (queryParams.length + 1));
            queryParams.push(status);
        }

        if (mode) {
            conditions.push('i.mode = $' + (queryParams.length + 1));
            queryParams.push(mode);
        }

        if (company_id) {
            conditions.push('i.company_id = $' + (queryParams.length + 1));
            queryParams.push(company_id);
        }

        if (student_id && (role === 'admin' || role === 'recruiter')) {
            conditions.push('i.student_id = $' + (queryParams.length + 1));
            queryParams.push(student_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY i.scheduled_at ASC';

        const result = await pool.query(query, queryParams);

        res.json({
            interviews: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get interview by ID
const getInterviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = req.user;

        const query = `
            SELECT 
                i.*,
                u.email as student_email,
                j.title as job_title,
                j.description as job_description,
                c.name as company_name,
                c.website as company_website,
                a.status as application_status
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN companies c ON i.company_id = c.id
            JOIN users u ON i.student_id = u.id
            WHERE i.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const interview = result.rows[0];

        // Role-based access control
        if (role === 'student' && interview.student_id !== userId) {
            return res.status(403).json({ 
                error: 'Access denied. Students can only view their own interviews' 
            });
        }

        res.json({ interview });
    } catch (error) {
        console.error('Error fetching interview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update interview (Admin/Recruiter only)
const updateInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduled_at, mode, status, feedback } = req.body;

        // Check if interview exists
        const existingInterview = await pool.query(
            'SELECT * FROM interviews WHERE id = $1',
            [id]
        );

        if (existingInterview.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        // Build dynamic update query
        if (scheduled_at !== undefined) {
            const scheduledDate = new Date(scheduled_at);
            const now = new Date();
            if (scheduledDate <= now) {
                return res.status(400).json({
                    error: 'Interview must be scheduled for a future date and time'
                });
            }
            updates.push(`scheduled_at = $${paramCount}`);
            values.push(scheduled_at);
            paramCount++;
        }

        if (mode !== undefined) {
            const validModes = ['online', 'offline'];
            if (!validModes.includes(mode)) {
                return res.status(400).json({
                    error: 'Invalid mode. Must be one of: online, offline'
                });
            }
            updates.push(`mode = $${paramCount}`);
            values.push(mode);
            paramCount++;
        }

        if (status !== undefined) {
            const validStatuses = ['scheduled', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status. Must be one of: scheduled, completed, cancelled'
                });
            }
            updates.push(`status = $${paramCount}`);
            values.push(status);
            paramCount++;
        }

        if (feedback !== undefined) {
            updates.push(`feedback = $${paramCount}`);
            values.push(feedback);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Add ID parameter
        values.push(id);

        const query = `
            UPDATE interviews 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            message: 'Interview updated successfully',
            interview: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating interview:', error);
        if (error.code === '23514') { // Check constraint violation (future date)
            return res.status(400).json({
                error: 'Interview must be scheduled for a future date and time'
            });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete interview (Admin only)
const deleteInterview = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM interviews WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json({
            message: 'Interview deleted successfully',
            interview: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting interview:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get student's own interviews
const getMyInterviews = async (req, res) => {
    try {
        const student_id = req.user.id;

        const result = await pool.query(`
            SELECT 
                i.*,
                j.title as job_title,
                j.description as job_description,
                j.package as job_package,
                j.type as job_type,
                c.name as company_name,
                c.website as company_website,
                a.status as application_status
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN companies c ON i.company_id = c.id
            WHERE i.student_id = $1
            ORDER BY i.scheduled_at ASC
        `, [student_id]);

        res.json({
            interviews: result.rows || [],
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching my interviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update interview mode (Recruiter only)
const updateInterviewMode = async (req, res) => {
    try {
        const { id } = req.params;
        const { mode } = req.body;

        // Validate mode
        const validModes = ['online', 'offline'];
        if (!mode || !validModes.includes(mode)) {
            return res.status(400).json({
                error: 'Invalid mode. Must be one of: online, offline'
            });
        }

        // Check if interview exists
        const interviewCheck = await pool.query(`
            SELECT i.*, j.title as job_title, c.name as company_name
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE i.id = $1
        `, [id]);

        if (interviewCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Update interview mode
        const result = await pool.query(`
            UPDATE interviews 
            SET mode = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [mode, id]);

        const updatedInterview = result.rows[0];

        // Get complete interview data for response
        const completeInterview = await pool.query(`
            SELECT 
                i.*,
                j.title as job_title,
                j.package as job_package,
                COALESCE(j.company_name, c.name) as company_name,
                u.email as student_email,
                p.full_name as student_name,
                p.phone as student_phone,
                p.branch as student_branch,
                p.year_of_study as student_year,
                a.status as application_status
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            LEFT JOIN companies c ON j.company_id = c.id
            JOIN users u ON a.student_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE i.id = $1
        `, [id]);

        res.json({
            message: 'Interview mode updated successfully',
            interview: completeInterview.rows[0]
        });

    } catch (error) {
        console.error('Error updating interview mode:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get recruiter's interviews (shortlisted candidates + scheduled interviews)
const getRecruiterInterviews = async (req, res) => {
    try {
        const recruiter_id = req.user.id;

        // Get shortlisted applications and existing interviews for all jobs (temporarily)
        // TODO: Filter by recruiter when created_by field is added
        const result = await pool.query(`
            SELECT 
                a.id as application_id,
                a.status as application_status,
                a.created_at as applied_at,
                j.id as job_id,
                j.title as job_title,
                COALESCE(j.company_name, c.name) as company_name,
                j.package as job_package,
                u.email as student_email,
                p.full_name as student_name,
                p.phone as student_phone,
                p.branch as student_branch,
                p.year_of_study as student_year,
                i.id as interview_id,
                i.scheduled_at,
                i.mode,
                i.status as interview_status,
                i.feedback,
                i.created_at as interview_created_at,
                CASE WHEN i.scheduled_at IS NOT NULL THEN i.scheduled_at ELSE a.created_at END as sort_date
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            LEFT JOIN companies c ON j.company_id = c.id
            JOIN users u ON a.student_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            LEFT JOIN interviews i ON a.id = i.application_id
            WHERE a.status = 'shortlisted'
            ORDER BY sort_date ASC
        `);

        // Transform the data to match frontend expectations
        const interviews = result.rows.map(row => ({
            interview_id: row.interview_id,
            application_id: row.application_id,
            job_id: row.job_id,
            job_title: row.job_title,
            company_name: row.company_name,
            job_package: row.job_package,
            student_name: row.student_name,
            student_email: row.student_email,
            student_phone: row.student_phone,
            student_branch: row.student_branch,
            student_year: row.student_year,
            application_status: row.application_status,
            status: row.interview_id ? row.interview_status : 'shortlisted',
            scheduled_at: row.scheduled_at,
            mode: row.mode,
            feedback: row.feedback,
            created_at: row.interview_created_at || row.applied_at
        }));

        res.json({
            interviews,
            total: interviews.length
        });
    } catch (error) {
        console.error('Error fetching recruiter interviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create interview for shortlisted candidate (Recruiter only)
const scheduleInterview = async (req, res) => {
    try {
        const { application_id, scheduled_at, mode = 'online' } = req.body;
        const recruiter_id = req.user.id;

        // Validate required fields
        if (!application_id || !scheduled_at) {
            return res.status(400).json({
                error: 'Missing required fields: application_id and scheduled_at are required'
            });
        }

        // Validate mode enum
        const validModes = ['online', 'offline'];
        if (!validModes.includes(mode)) {
            return res.status(400).json({
                error: 'Invalid mode. Must be one of: online, offline'
            });
        }

        // Validate scheduled_at is in the future
        const scheduledDate = new Date(scheduled_at);
        const now = new Date();
        if (scheduledDate <= now) {
            return res.status(400).json({
                error: 'Interview must be scheduled for a future date and time'
            });
        }

        // Check if application exists and is shortlisted
        // TODO: Add recruiter ownership check when created_by field is added
        const applicationCheck = await pool.query(`
            SELECT 
                a.id, a.student_id, a.status,
                j.id as job_id, j.title as job_title,
                COALESCE(j.company_name, c.name) as company_name,
                j.company_id,
                u.email as student_email,
                p.full_name as student_name
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            LEFT JOIN companies c ON j.company_id = c.id
            JOIN users u ON a.student_id = u.id
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE a.id = $1
        `, [application_id]);

        if (applicationCheck.rows.length === 0) {
            return res.status(404).json({ 
                error: 'Application not found' 
            });
        }

        const application = applicationCheck.rows[0];

        if (application.status !== 'shortlisted') {
            return res.status(400).json({ 
                error: 'Can only schedule interviews for shortlisted candidates' 
            });
        }

        // Check for duplicate interview for this application
        const duplicateCheck = await pool.query(
            'SELECT id FROM interviews WHERE application_id = $1',
            [application_id]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Interview already scheduled for this application' 
            });
        }

        // Create the interview
        const result = await pool.query(`
            INSERT INTO interviews (application_id, company_id, student_id, scheduled_at, mode, status)
            VALUES ($1, $2, $3, $4, $5, 'scheduled')
            RETURNING *
        `, [application_id, application.company_id, application.student_id, scheduled_at, mode]);

        res.status(201).json({
            message: 'Interview scheduled successfully',
            interview: {
                ...result.rows[0],
                job_title: application.job_title,
                company_name: application.company_name,
                student_name: application.student_name,
                student_email: application.student_email
            }
        });
    } catch (error) {
        console.error('Error scheduling interview:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ 
                error: 'Interview already scheduled for this application' 
            });
        }
        if (error.code === '23514') { // Check constraint violation (future date)
            return res.status(400).json({
                error: 'Interview must be scheduled for a future date and time'
            });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createInterview,
    getInterviews,
    getInterviewById,
    updateInterview,
    deleteInterview,
    getMyInterviews,
    getRecruiterInterviews,
    scheduleInterview,
    updateInterviewMode
};
