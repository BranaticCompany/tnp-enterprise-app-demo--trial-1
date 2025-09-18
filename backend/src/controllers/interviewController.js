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
                c.name as company_name,
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

module.exports = {
    createInterview,
    getInterviews,
    getInterviewById,
    updateInterview,
    deleteInterview
};
