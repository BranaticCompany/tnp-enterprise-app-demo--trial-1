const db = require('../utils/database');

// Status normalization function
const normalizeStatus = (status) => {
  const statusMap = {
    'applied': 'applied',
    'reviewed': 'shortlisted',
    'round1_qualified': 'shortlisted',
    'round2_qualified': 'shortlisted',
    'shortlisted': 'shortlisted',
    'offered': 'shortlisted',
    'hired': 'placed',
    'placed': 'placed',
    'rejected': 'rejected'
  };
  return statusMap[status] || status;
};

// POST /api/v1/applications - Students apply for a job
const applyForJob = async (req, res) => {
  try {
    const { job_id, jobId } = req.body;
    const student_id = req.user.id;

    // Accept both job_id and jobId for compatibility
    const finalJobId = job_id || jobId;

    if (!finalJobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    // Check if job exists and get deadline
    const jobResult = await db.query(`
      SELECT j.id, j.title, j.application_deadline, c.name as company_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `, [finalJobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobResult.rows[0];

    // Check if deadline has passed
    const now = new Date();
    const deadline = new Date(job.application_deadline);

    if (deadline <= now) {
      return res.status(400).json({
        error: 'Application deadline has passed',
        deadline: job.application_deadline
      });
    }

    // Check for duplicate application
    const existingApplication = await db.query(
      'SELECT id FROM applications WHERE student_id = $1 AND job_id = $2',
      [student_id, finalJobId]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(409).json({
        error: 'You have already applied for this job'
      });
    }

    // Create application
    const result = await db.query(`
      INSERT INTO applications (student_id, job_id, status) 
      VALUES ($1, $2, 'applied') 
      RETURNING id, student_id, job_id, status, created_at, updated_at
    `, [student_id, finalJobId]);

    const application = {
      ...result.rows[0],
      job_title: job.title,
      company_name: job.company_name
    };

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/applications/me - Students view their own applications
const getMyApplications = async (req, res) => {
  try {
    const student_id = req.user.id;

    const result = await db.query(`
      SELECT 
        a.id,
        a.job_id,
        a.status,
        a.created_at,
        a.updated_at,
        j.title as job_title,
        j.description as job_description,
        j.eligibility as job_eligibility,
        j.application_deadline,
        j.package as job_package,
        j.type as job_type,
        c.name as company_name,
        c.website as company_website,
        c.description as company_description,
        -- Count total applications for this job
        (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as total_applications,
        -- Include placement data with package priority
        p.package as placement_package,
        p.status as placement_status,
        -- Use placement package if exists, otherwise job package
        COALESCE(p.package, j.package) as final_package
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      LEFT JOIN placements p ON a.student_id = p.student_id AND a.job_id = p.job_id
      WHERE a.student_id = $1
      ORDER BY a.created_at DESC
    `, [student_id]);

    // Normalize statuses in the response
    const normalizedApplications = result.rows.map(app => ({
      ...app,
      status: normalizeStatus(app.status),
      normalized_status: normalizeStatus(app.status)
    }));

    res.status(200).json({
      applications: normalizedApplications || [],
      count: result.rowCount || 0
    });

  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/applications/job/:jobId - Recruiter views applications for their company's job
const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // First verify the job exists and get company info
    const jobResult = await db.query(`
      SELECT j.id, j.title, c.name as company_name
      FROM jobs j
      JOIN companies c ON j.company_id = c.id
      WHERE j.id = $1
    `, [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get applications for this job with student profile info
    const result = await db.query(`
      SELECT 
        a.id,
        a.status,
        a.created_at,
        a.updated_at,
        u.email as student_email,
        p.full_name as student_name,
        p.phone as student_phone,
        p.branch as student_branch,
        p.year_of_study as student_year,
        p.resume_url as student_resume
      FROM applications a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE a.job_id = $1
      ORDER BY a.created_at DESC
    `, [jobId]);

    const job = jobResult.rows[0];

    res.status(200).json({
      job: {
        id: jobId,
        title: job.title,
        company_name: job.company_name
      },
      applications: result.rows || [],
      count: result.rowCount || 0
    });

  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/applications - Admin views all applications
const getAllApplications = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.id,
        a.status,
        a.created_at,
        a.updated_at,
        u.email as student_email,
        p.full_name as student_name,
        p.branch as student_branch,
        p.year_of_study as student_year,
        j.title as job_title,
        j.application_deadline,
        c.name as company_name
      FROM applications a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ORDER BY a.created_at DESC
    `);

    res.status(200).json({
      applications: result.rows || [],
      count: result.rowCount || 0
    });

  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/v1/applications/:id/status - Update application status (Recruiter/Admin only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['applied', 'shortlisted', 'placed', 'rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    // Check if application exists
    const existingApp = await db.query(`
      SELECT 
        a.id,
        a.status as current_status,
        j.title as job_title,
        c.name as company_name,
        u.email as student_email
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      JOIN users u ON a.student_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (existingApp.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Update status
    const result = await db.query(`
      UPDATE applications 
      SET status = $2, updated_at = NOW() 
      WHERE id = $1 
      RETURNING id, status, updated_at
    `, [id, status]);

    const application = existingApp.rows[0];

    res.status(200).json({
      message: 'Application status updated successfully',
      application: {
        ...result.rows[0],
        job_title: application.job_title,
        company_name: application.company_name,
        student_email: application.student_email,
        previous_status: application.current_status
      }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  getAllApplications,
  updateApplicationStatus
};
