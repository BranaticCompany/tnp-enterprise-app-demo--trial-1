const pool = require('../utils/database');

/**
 * Get comprehensive dashboard data for recruiter
 * Returns metrics, recent jobs, applications, and upcoming interviews
 */
const getDashboard = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    console.log('=== RECRUITER DASHBOARD DEBUG ===');
    console.log('Recruiter ID:', recruiterId);

    // Get all jobs (since created_by column doesn't exist yet)
    const jobsQuery = `
      SELECT 
        COUNT(*) as jobs_posted,
        MAX(package) as highest_package
      FROM jobs 
    `;
    
    // Get all applications (since created_by column doesn't exist yet)
    const applicationsQuery = `
      SELECT 
        COUNT(*) as applications_received,
        COUNT(CASE WHEN status = 'offered' THEN 1 END) as offers_made,
        COUNT(CASE WHEN status = 'placed' THEN 1 END) as placed_count
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
    `;

    // Get recruiter-specific interviews count (shortlisted applications + scheduled interviews)
    // This matches what the interview tab shows
    const interviewsQuery = `
      SELECT COUNT(*) as interviews_scheduled
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN interviews i ON a.id = i.application_id
      WHERE a.status = 'shortlisted'
    `;

    // Get recent jobs (last 3) - system wide for now since no created_by column
    const recentJobsQuery = `
      SELECT 
        j.id,
        j.title,
        COALESCE(j.company_name, c.name) as company_name,
        j.created_at as posted_at,
        COUNT(a.id) as application_count
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN applications a ON j.id = a.job_id
      GROUP BY j.id, j.title, j.company_name, c.name, j.created_at
      ORDER BY j.created_at DESC
      LIMIT 3
    `;

    // Get recent applications (last 3) - system wide for now since no created_by column
    const recentApplicationsQuery = `
      SELECT 
        a.id,
        COALESCE(p.full_name, u.email) as student_name,
        j.title as job_title,
        a.status,
        a.created_at as applied_at
      FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN users u ON a.student_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY a.created_at DESC
      LIMIT 3
    `;

    // Get upcoming interviews (next 2) - only from shortlisted applications to match interview tab
    const upcomingInterviewsQuery = `
      SELECT 
        i.id,
        j.title as job_title,
        COALESCE(p.full_name, u.email) as student_name,
        i.scheduled_at as date,
        i.mode,
        i.status
      FROM interviews i
      INNER JOIN applications a ON i.application_id = a.id
      INNER JOIN jobs j ON a.job_id = j.id
      INNER JOIN users u ON a.student_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE i.scheduled_at >= NOW()
        AND i.status IN ('scheduled', 'completed')
        AND a.status = 'shortlisted'
      ORDER BY i.scheduled_at ASC
      LIMIT 2
    `;

    // Execute all queries
    const [
      jobsResult,
      applicationsResult,
      interviewsResult,
      recentJobsResult,
      recentApplicationsResult,
      upcomingInterviewsResult
    ] = await Promise.all([
      pool.query(jobsQuery),
      pool.query(applicationsQuery),
      pool.query(interviewsQuery),
      pool.query(recentJobsQuery),
      pool.query(recentApplicationsQuery),
      pool.query(upcomingInterviewsQuery)
    ]);

    console.log('Jobs result:', jobsResult.rows[0]);
    console.log('Applications result:', applicationsResult.rows[0]);
    console.log('Interviews result:', interviewsResult.rows[0]);
    console.log('Recent jobs count:', recentJobsResult.rows.length);
    console.log('Recent applications count:', recentApplicationsResult.rows.length);
    console.log('Upcoming interviews count:', upcomingInterviewsResult.rows.length);

    // Format the response with all data
    const dashboardData = {
      jobsPosted: parseInt(jobsResult.rows[0]?.jobs_posted || 0),
      applicationsReceived: parseInt(applicationsResult.rows[0]?.applications_received || 0),
      interviewsScheduled: parseInt(interviewsResult.rows[0]?.interviews_scheduled || 0),
      offersMade: parseInt(applicationsResult.rows[0]?.offers_made || 0),
      placedCount: parseInt(applicationsResult.rows[0]?.placed_count || 0),
      highestPackage: parseFloat(jobsResult.rows[0]?.highest_package || 0),
      recentJobs: recentJobsResult.rows.map(job => ({
        id: job.id,
        title: job.title,
        company_name: job.company_name,
        posted_at: job.posted_at,
        application_count: parseInt(job.application_count || 0)
      })),
      recentApplications: recentApplicationsResult.rows.map(app => ({
        id: app.id,
        student_name: app.student_name,
        job_title: app.job_title,
        status: app.status,
        applied_at: app.applied_at
      })),
      upcomingInterviews: upcomingInterviewsResult.rows.map(interview => ({
        id: interview.id,
        job_title: interview.job_title,
        student_name: interview.student_name,
        date: interview.date,
        mode: interview.mode,
        status: interview.status
      }))
    };

    console.log('Final dashboard data:', JSON.stringify(dashboardData, null, 2));

    res.json(dashboardData);
  } catch (error) {
    console.error('=== RECRUITER DASHBOARD ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to load dashboard data',
      details: error.message 
    });
  }
};

module.exports = {
  getDashboard
};
