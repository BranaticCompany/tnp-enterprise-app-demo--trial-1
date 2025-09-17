const db = require('../utils/database'); // correct path

// Validation helper function
const validateJobData = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Job title is required');
  }

  if (data.title && data.title.trim().length > 255) {
    errors.push('Job title must be less than 255 characters');
  }

  if (!data.application_deadline) {
    errors.push('Application deadline is required');
  }

  if (data.application_deadline) {
    const deadline = new Date(data.application_deadline);
    const now = new Date();

    if (isNaN(deadline.getTime())) {
      errors.push('Invalid application deadline format');
    } else if (deadline <= now) {
      errors.push('Application deadline must be in the future');
    }
  }

  if (!data.company_id) {
    errors.push('Company ID is required');
  }

  return errors;
};

// GET /api/v1/jobs
exports.getAllJobs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT jobs.*, companies.name AS company_name
      FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      ORDER BY jobs.application_deadline ASC
    `);

    res.status(200).json({
      jobs: result.rows || [],
      count: result.rowCount || 0,
    });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/jobs/:id
exports.getJobById = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT jobs.*, companies.name AS company_name
      FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.status(200).json({ job: result.rows[0] });
  } catch (err) {
    console.error('Error fetching job by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/jobs - Create new job (Recruiter/Admin only)
const createJob = async (req, res) => {
  try {
    const { company_id, title, description, eligibility, application_deadline } = req.body;

    // Validate input data
    const validationErrors = validateJobData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check if company exists
    const companyExists = await db.query(
      'SELECT id FROM companies WHERE id = $1',
      [company_id]
    );

    if (companyExists.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create new job
    const result = await db.query(`
      INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, company_id, title, description, eligibility, application_deadline, created_at, updated_at
    `, [company_id, title.trim(), description || null, eligibility || null, application_deadline]);

    // Get company details for response
    const companyResult = await db.query(
      'SELECT name, website FROM companies WHERE id = $1',
      [company_id]
    );

    const jobWithCompany = {
      ...result.rows[0],
      company_name: companyResult.rows[0].name,
      company_website: companyResult.rows[0].website
    };

    res.status(201).json({
      message: 'Job created successfully',
      job: jobWithCompany
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/v1/jobs/:id - Update job (Recruiter/Admin only)
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_id, title, description, eligibility, application_deadline } = req.body;

    // Validate input data
    const validationErrors = validateJobData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check if job exists
    const existingJob = await db.query(
      'SELECT id FROM jobs WHERE id = $1',
      [id]
    );

    if (existingJob.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if company exists
    const companyExists = await db.query(
      'SELECT id FROM companies WHERE id = $1',
      [company_id]
    );

    if (companyExists.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update job
    const result = await db.query(`
      UPDATE jobs 
      SET company_id = $2, title = $3, description = $4, eligibility = $5, application_deadline = $6, updated_at = NOW() 
      WHERE id = $1 
      RETURNING id, company_id, title, description, eligibility, application_deadline, created_at, updated_at
    `, [id, company_id, title.trim(), description || null, eligibility || null, application_deadline]);

    // Get company details for response
    const companyResult = await db.query(
      'SELECT name, website FROM companies WHERE id = $1',
      [company_id]
    );

    const jobWithCompany = {
      ...result.rows[0],
      company_name: companyResult.rows[0].name,
      company_website: companyResult.rows[0].website
    };

    res.status(200).json({
      message: 'Job updated successfully',
      job: jobWithCompany
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/v1/jobs/:id - Delete job (Recruiter/Admin only)
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job exists and get details
    const existingJob = await db.query(`
      SELECT j.id, j.title, c.name as company_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `, [id]);

    if (existingJob.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Delete job
    await db.query('DELETE FROM jobs WHERE id = $1', [id]);

    res.status(200).json({
      message: 'Job deleted successfully',
      deletedJob: {
        id: existingJob.rows[0].id,
        title: existingJob.rows[0].title,
        company_name: existingJob.rows[0].company_name
      }
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllJobs: exports.getAllJobs,
  getJobById: exports.getJobById,
  createJob,
  updateJob,
  deleteJob
};
