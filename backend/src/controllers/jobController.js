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

  if (!data.company_name || data.company_name.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (data.company_name && data.company_name.trim().length > 255) {
    errors.push('Company name must be less than 255 characters');
  }

  if (data.cgpa_criteria === undefined || data.cgpa_criteria === null || data.cgpa_criteria === '') {
    errors.push('CGPA criteria is required');
  }

  if (data.cgpa_criteria !== undefined && data.cgpa_criteria !== null && data.cgpa_criteria !== '') {
    const cgpa = parseFloat(data.cgpa_criteria);
    if (isNaN(cgpa) || cgpa < 0.0 || cgpa > 10.0) {
      errors.push('CGPA criteria must be a number between 0.0 and 10.0');
    }
  }

  // Validate skills if provided
  if (data.skills !== undefined && data.skills !== null) {
    if (!Array.isArray(data.skills)) {
      errors.push('Skills must be an array');
    } else {
      // Check each skill is a string
      for (let i = 0; i < data.skills.length; i++) {
        if (typeof data.skills[i] !== 'string' || data.skills[i].trim().length === 0) {
          errors.push(`Skill at position ${i + 1} must be a non-empty string`);
        }
      }
    }
  }

  return errors;
};

// GET /api/v1/jobs
exports.getAllJobs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        jobs.*, 
        COALESCE(jobs.company_name, companies.name) AS company_name,
        (SELECT COUNT(*) FROM applications WHERE job_id = jobs.id) as application_count
      FROM jobs
      LEFT JOIN companies ON jobs.company_id = companies.id
      ORDER BY jobs.application_deadline ASC
    `);

    // Map database fields to frontend expected format
    const jobsWithExtras = result.rows.map(job => {
      return {
        ...job,
        salary: job.package, // Map package field to salary for frontend compatibility
        jobType: job.type || 'Full Time', // Map type field to jobType for frontend compatibility
        company: job.company_name, // Add company field for frontend compatibility
        applicationCount: job.application_count || 0, // Add real application count from database
        skills: job.skills || [] // Ensure skills is always an array
      };
    });

    res.status(200).json({
      jobs: jobsWithExtras || [],
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
      SELECT jobs.*, COALESCE(jobs.company_name, companies.name) AS company_name
      FROM jobs
      LEFT JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    // Map database fields to frontend expected format
    const jobWithExtras = {
      ...job,
      salary: job.package, // Map package field to salary for frontend compatibility
      jobType: job.type || 'Full Time', // Map type field to jobType for frontend compatibility
      company: job.company_name, // Add company field for frontend compatibility
      skills: job.skills || [] // Ensure skills is always an array
    };

    res.status(200).json({ job: jobWithExtras });
  } catch (err) {
    console.error('Error fetching job by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/jobs - Create new job (Recruiter/Admin only)
const createJob = async (req, res) => {
  try {
    // Debug logging - log the entire request body
    console.log('=== CREATE JOB DEBUG ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { company_name, title, description, eligibility, application_deadline, package, type, location, cgpa_criteria, skills } = req.body;

    // Debug logging - log extracted skills
    console.log('Extracted skills:', skills);
    console.log('Skills type:', typeof skills);
    console.log('Skills is array:', Array.isArray(skills));

    // Validate input data
    const validationErrors = validateJobData(req.body);
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Process skills - ensure it's always a valid JSON string
    let skillsJson;
    if (skills && Array.isArray(skills) && skills.length > 0) {
      skillsJson = JSON.stringify(skills);
    } else {
      skillsJson = '[]';
    }
    console.log('Skills JSON to store:', skillsJson);

    // Create new job with all fields (no company_id validation needed since we use company_name)
    const queryParams = [
      company_name.trim(),
      title.trim(),
      description || null,
      eligibility || null,
      application_deadline,
      package || null,
      type || 'Full Time',
      location || null,
      parseFloat(cgpa_criteria),
      skillsJson
    ];

    console.log('Query parameters:', queryParams);

    const result = await db.query(`
      INSERT INTO jobs (company_name, title, description, eligibility, application_deadline, package, type, location, cgpa_criteria, skills) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, company_name, title, description, eligibility, application_deadline, package, type, location, cgpa_criteria, skills, created_at, updated_at
    `, queryParams);

    const jobData = result.rows[0];
    console.log('Job created successfully:', jobData.id);

    res.status(201).json({
      message: 'Job created successfully',
      job: jobData
    });

  } catch (error) {
    console.error('=== CREATE JOB ERROR ===');
    console.error('Full error object:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/v1/jobs/:id - Update job (Recruiter/Admin only)
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, title, description, eligibility, application_deadline, package, type, location, cgpa_criteria, skills } = req.body;

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

    // Process skills - ensure it's always a valid JSON string
    let skillsJson;
    if (skills && Array.isArray(skills) && skills.length > 0) {
      skillsJson = JSON.stringify(skills);
    } else {
      skillsJson = '[]';
    }

    // Update job with new schema
    const result = await db.query(`
      UPDATE jobs 
      SET company_name = $2, title = $3, description = $4, eligibility = $5, application_deadline = $6, package = $7, type = $8, location = $9, cgpa_criteria = $10, skills = $11, updated_at = NOW() 
      WHERE id = $1 
      RETURNING id, company_name, title, description, eligibility, application_deadline, package, type, location, cgpa_criteria, skills, created_at, updated_at
    `, [
      id,
      company_name.trim(),
      title.trim(),
      description || null,
      eligibility || null,
      application_deadline,
      package || null,
      type || 'Full Time',
      location || null,
      parseFloat(cgpa_criteria),
      skillsJson
    ]);

    const jobData = result.rows[0];

    res.status(200).json({
      message: 'Job updated successfully',
      job: jobData
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

// GET /api/v1/jobs/recruiter - Get jobs posted by the current recruiter
const getRecruiterJobs = async (req, res) => {
  try {
    // For now, return all jobs since we don't have created_by field yet
    // TODO: Add created_by field and filter by recruiter
    const result = await db.query(`
      SELECT 
        jobs.*, 
        COALESCE(jobs.company_name, companies.name) AS company_name,
        (SELECT COUNT(*) FROM applications WHERE job_id = jobs.id) as application_count
      FROM jobs
      LEFT JOIN companies ON jobs.company_id = companies.id
      ORDER BY jobs.created_at DESC
    `);

    // Map database fields to frontend expected format
    const jobsWithExtras = result.rows.map(job => {
      return {
        ...job,
        salary: job.package, // Map package field to salary for frontend compatibility
        jobType: job.type || 'Full Time', // Map type field to jobType for frontend compatibility
        company: job.company_name, // Add company field for frontend compatibility
        applicationCount: job.application_count || 0, // Add real application count from database
        deadline: job.application_deadline, // Map deadline field for frontend compatibility
        createdAt: job.created_at, // Map created_at field for frontend compatibility
        requirements: job.eligibility, // Map eligibility to requirements for frontend compatibility
        skills: job.skills || [] // Ensure skills is always an array
      };
    });

    res.status(200).json({
      jobs: jobsWithExtras || [],
      count: result.rowCount || 0,
    });
  } catch (err) {
    console.error('Error fetching recruiter jobs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllJobs: exports.getAllJobs,
  getJobById: exports.getJobById,
  createJob,
  updateJob,
  deleteJob,
  getRecruiterJobs
};
