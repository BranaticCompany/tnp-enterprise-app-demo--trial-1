const pool = require('../utils/database');

// Create a new placement (Admin only)
const createPlacement = async (req, res) => {
    try {
        const { student_id, job_id, company_id, package: salaryPackage, role, status = 'offered' } = req.body;

        // Validate required fields
        if (!student_id || !job_id || !company_id || !role) {
            return res.status(400).json({
                error: 'Missing required fields: student_id, job_id, company_id, and role are required'
            });
        }

        // Validate status enum
        const validStatuses = ['offered', 'accepted', 'joined', 'declined'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be one of: offered, accepted, joined, declined'
            });
        }

        // Validate package if provided
        if (salaryPackage !== undefined && salaryPackage !== null) {
            if (isNaN(salaryPackage) || salaryPackage < 0) {
                return res.status(400).json({
                    error: 'Package must be a positive number'
                });
            }
        }

        // Check if student exists and has student role
        const studentCheck = await pool.query(
            'SELECT id, role FROM users WHERE id = $1',
            [student_id]
        );

        if (studentCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (studentCheck.rows[0].role !== 'student') {
            return res.status(400).json({ error: 'User must be a student' });
        }

        // Check if job exists and get its company_id
        const jobCheck = await pool.query(
            'SELECT id, company_id FROM jobs WHERE id = $1',
            [job_id]
        );

        if (jobCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Verify company_id matches job's company_id
        if (jobCheck.rows[0].company_id !== company_id) {
            return res.status(400).json({ 
                error: 'Company ID must match the job\'s company' 
            });
        }

        // Check if company exists
        const companyCheck = await pool.query(
            'SELECT id FROM companies WHERE id = $1',
            [company_id]
        );

        if (companyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        // Check for duplicate placement (student-job combination)
        const duplicateCheck = await pool.query(
            'SELECT id FROM placements WHERE student_id = $1 AND job_id = $2',
            [student_id, job_id]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(409).json({ 
                error: 'Placement already exists for this student-job combination' 
            });
        }

        // Create the placement
        const result = await pool.query(
            `INSERT INTO placements (student_id, job_id, company_id, package, role, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [student_id, job_id, company_id, salaryPackage, role, status]
        );

        res.status(201).json({
            message: 'Placement created successfully',
            placement: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating placement:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ 
                error: 'Placement already exists for this student-job combination' 
            });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all placements with role-based filtering
const getPlacements = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { status, company_id, student_id } = req.query;

        let query = `
            SELECT 
                p.*,
                u.email as student_email,
                j.title as job_title,
                c.name as company_name
            FROM placements p
            JOIN users u ON p.student_id = u.id
            JOIN jobs j ON p.job_id = j.id
            JOIN companies c ON p.company_id = c.id
        `;

        const queryParams = [];
        const conditions = [];

        // Role-based filtering
        if (role === 'student') {
            conditions.push('p.student_id = $' + (queryParams.length + 1));
            queryParams.push(userId);
        } else if (role === 'recruiter') {
            // Recruiters can see placements for their company's jobs
            // For now, allowing all placements - can be refined based on recruiter-company association
        }
        // Admins can see all placements (no additional filtering)

        // Additional filters
        if (status) {
            conditions.push('p.status = $' + (queryParams.length + 1));
            queryParams.push(status);
        }

        if (company_id) {
            conditions.push('p.company_id = $' + (queryParams.length + 1));
            queryParams.push(company_id);
        }

        if (student_id && (role === 'admin' || role === 'recruiter')) {
            conditions.push('p.student_id = $' + (queryParams.length + 1));
            queryParams.push(student_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.created_at DESC';

        const result = await pool.query(query, queryParams);

        res.json({
            placements: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching placements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get placement by ID
const getPlacementById = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id: userId } = req.user;

        const query = `
            SELECT 
                p.*,
                u.email as student_email,
                j.title as job_title,
                j.description as job_description,
                c.name as company_name,
                c.website as company_website
            FROM placements p
            JOIN users u ON p.student_id = u.id
            JOIN jobs j ON p.job_id = j.id
            JOIN companies c ON p.company_id = c.id
            WHERE p.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Placement not found' });
        }

        const placement = result.rows[0];

        // Role-based access control
        if (role === 'student' && placement.student_id !== userId) {
            return res.status(403).json({ 
                error: 'Access denied. Students can only view their own placements' 
            });
        }

        res.json({ placement });
    } catch (error) {
        console.error('Error fetching placement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update placement (Admin only)
const updatePlacement = async (req, res) => {
    try {
        const { id } = req.params;
        const { package: salaryPackage, role, status } = req.body;

        // Check if placement exists
        const existingPlacement = await pool.query(
            'SELECT * FROM placements WHERE id = $1',
            [id]
        );

        if (existingPlacement.rows.length === 0) {
            return res.status(404).json({ error: 'Placement not found' });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        // Build dynamic update query
        if (salaryPackage !== undefined) {
            if (salaryPackage !== null && (isNaN(salaryPackage) || salaryPackage < 0)) {
                return res.status(400).json({
                    error: 'Package must be a positive number or null'
                });
            }
            updates.push(`package = $${paramCount}`);
            values.push(salaryPackage);
            paramCount++;
        }

        if (role !== undefined) {
            if (!role || role.trim() === '') {
                return res.status(400).json({ error: 'Role cannot be empty' });
            }
            updates.push(`role = $${paramCount}`);
            values.push(role.trim());
            paramCount++;
        }

        if (status !== undefined) {
            const validStatuses = ['offered', 'accepted', 'joined', 'declined'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status. Must be one of: offered, accepted, joined, declined'
                });
            }
            updates.push(`status = $${paramCount}`);
            values.push(status);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Add ID parameter
        values.push(id);

        const query = `
            UPDATE placements 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        res.json({
            message: 'Placement updated successfully',
            placement: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating placement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete placement (Admin only)
const deletePlacement = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM placements WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Placement not found' });
        }

        res.json({
            message: 'Placement deleted successfully',
            placement: result.rows[0]
        });
    } catch (error) {
        console.error('Error deleting placement:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createPlacement,
    getPlacements,
    getPlacementById,
    updatePlacement,
    deletePlacement
};
