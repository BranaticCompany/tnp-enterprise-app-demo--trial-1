const db = require('../utils/database');

// Status normalization function (same as in applicationController)
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

// GET /api/v1/reports/applications - Applications by Job/Company (Admin/Recruiter only)
const getApplicationsReport = async (req, res) => {
  try {
    // Applications by company with job breakdown
    const applicationsByCompany = await db.query(`
      SELECT 
        c.id as company_id,
        c.name as company_name,
        j.id as job_id,
        j.title as job_title,
        COUNT(a.id) as total_applications,
        COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied_count,
        COUNT(CASE WHEN a.status = 'reviewed' THEN 1 END) as reviewed_count,
        COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted_count,
        COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count
      FROM companies c
      LEFT JOIN jobs j ON c.id = j.company_id
      LEFT JOIN applications a ON j.id = a.job_id
      GROUP BY c.id, c.name, j.id, j.title
      ORDER BY c.name, j.title
    `);

    // Overall application statistics
    const overallStats = await db.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_companies,
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(a.id) as total_applications,
        COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied_count,
        COUNT(CASE WHEN a.status = 'reviewed' THEN 1 END) as reviewed_count,
        COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) as shortlisted_count,
        COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN a.status = 'hired' THEN 1 END) as hired_count
      FROM companies c
      LEFT JOIN jobs j ON c.id = j.company_id
      LEFT JOIN applications a ON j.id = a.job_id
    `);

    res.status(200).json({
      overall_statistics: overallStats.rows[0] || {},
      applications_by_company: applicationsByCompany.rows || []
    });

  } catch (error) {
    console.error('Get applications report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/reports/interviews - Interview Statistics (Admin/Recruiter only)
const getInterviewsReport = async (req, res) => {
  try {
    // Overall interview statistics
    const overallStats = await db.query(`
      SELECT 
        COUNT(i.id) as total_interviews,
        COUNT(CASE WHEN i.status = 'scheduled' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN i.status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN i.mode = 'online' THEN 1 END) as online_count,
        COUNT(CASE WHEN i.mode = 'offline' THEN 1 END) as offline_count,
        COUNT(CASE WHEN i.feedback IS NOT NULL AND i.feedback != '' THEN 1 END) as interviews_with_feedback
      FROM interviews i
    `);

    // Interviews by company
    const interviewsByCompany = await db.query(`
      SELECT 
        c.id as company_id,
        c.name as company_name,
        COUNT(i.id) as total_interviews,
        COUNT(CASE WHEN i.status = 'scheduled' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN i.status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN i.mode = 'online' THEN 1 END) as online_count,
        COUNT(CASE WHEN i.mode = 'offline' THEN 1 END) as offline_count
      FROM companies c
      LEFT JOIN interviews i ON c.id = i.company_id
      GROUP BY c.id, c.name
      HAVING COUNT(i.id) > 0
      ORDER BY total_interviews DESC, c.name
    `);

    // Recent interview trends (last 30 days)
    const recentTrends = await db.query(`
      SELECT 
        DATE(i.scheduled_at) as interview_date,
        COUNT(i.id) as interviews_count,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_count
      FROM interviews i
      WHERE i.scheduled_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(i.scheduled_at)
      ORDER BY interview_date DESC
      LIMIT 30
    `);

    res.status(200).json({
      overall_statistics: overallStats.rows[0] || {},
      interviews_by_company: interviewsByCompany.rows || [],
      recent_trends: recentTrends.rows || []
    });

  } catch (error) {
    console.error('Get interviews report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/reports/placements - Placement Statistics (Admin/Recruiter only)
const getPlacementsReport = async (req, res) => {
  try {
    // Overall placement statistics
    const overallStats = await db.query(`
      SELECT 
        COUNT(p.id) as total_placements,
        COUNT(CASE WHEN p.status = 'offered' THEN 1 END) as offered_count,
        COUNT(CASE WHEN p.status = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN p.status = 'joined' THEN 1 END) as joined_count,
        COUNT(CASE WHEN p.status = 'declined' THEN 1 END) as declined_count,
        AVG(p.package) as average_package,
        MAX(p.package) as highest_package,
        MIN(p.package) as lowest_package,
        COUNT(DISTINCT p.student_id) as unique_students_placed
      FROM placements p
    `);

    // Placements by company
    const placementsByCompany = await db.query(`
      SELECT 
        c.id as company_id,
        c.name as company_name,
        COUNT(p.id) as total_placements,
        COUNT(CASE WHEN p.status = 'offered' THEN 1 END) as offered_count,
        COUNT(CASE WHEN p.status = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN p.status = 'joined' THEN 1 END) as joined_count,
        COUNT(CASE WHEN p.status = 'declined' THEN 1 END) as declined_count,
        AVG(p.package) as average_package,
        MAX(p.package) as highest_package,
        MIN(p.package) as lowest_package
      FROM companies c
      LEFT JOIN placements p ON c.id = p.company_id
      GROUP BY c.id, c.name
      HAVING COUNT(p.id) > 0
      ORDER BY total_placements DESC, c.name
    `);

    // Package distribution
    const packageDistribution = await db.query(`
      SELECT 
        CASE 
          WHEN p.package < 300000 THEN 'Below 3 LPA'
          WHEN p.package >= 300000 AND p.package < 500000 THEN '3-5 LPA'
          WHEN p.package >= 500000 AND p.package < 800000 THEN '5-8 LPA'
          WHEN p.package >= 800000 AND p.package < 1200000 THEN '8-12 LPA'
          WHEN p.package >= 1200000 THEN 'Above 12 LPA'
        END as package_range,
        COUNT(p.id) as placement_count
      FROM placements p
      WHERE p.package IS NOT NULL
      GROUP BY package_range
      ORDER BY MIN(p.package)
    `);

    res.status(200).json({
      overall_statistics: overallStats.rows[0] || {},
      placements_by_company: placementsByCompany.rows || [],
      package_distribution: packageDistribution.rows || []
    });

  } catch (error) {
    console.error('Get placements report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/reports/students - Student Activity Overview (Admin/Recruiter only)
const getStudentsReport = async (req, res) => {
  try {
    // Overall student statistics
    const overallStats = await db.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT p.user_id) as students_with_profiles,
        COUNT(DISTINCT a.student_id) as students_who_applied,
        COUNT(DISTINCT i.student_id) as students_interviewed,
        COUNT(DISTINCT pl.student_id) as students_placed
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN applications a ON u.id = a.student_id
      LEFT JOIN interviews i ON u.id = i.student_id
      LEFT JOIN placements pl ON u.id = pl.student_id
      WHERE u.role = 'student'
    `);

    // Student activity by branch
    const activityByBranch = await db.query(`
      SELECT 
        COALESCE(p.branch, 'No Profile') as branch,
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT a.student_id) as applied_students,
        COUNT(DISTINCT i.student_id) as interviewed_students,
        COUNT(DISTINCT pl.student_id) as placed_students,
        ROUND(
          (COUNT(DISTINCT pl.student_id)::DECIMAL / NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 
          2
        ) as placement_percentage
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN applications a ON u.id = a.student_id
      LEFT JOIN interviews i ON u.id = i.student_id
      LEFT JOIN placements pl ON u.id = pl.student_id
      WHERE u.role = 'student'
      GROUP BY p.branch
      ORDER BY placement_percentage DESC NULLS LAST, total_students DESC
    `);

    // Student activity by year
    const activityByYear = await db.query(`
      SELECT 
        COALESCE(p.year_of_study::text, 'No Profile') as year_of_study,
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT a.student_id) as applied_students,
        COUNT(DISTINCT i.student_id) as interviewed_students,
        COUNT(DISTINCT pl.student_id) as placed_students,
        ROUND(
          (COUNT(DISTINCT pl.student_id)::DECIMAL / NULLIF(COUNT(DISTINCT u.id), 0)) * 100, 
          2
        ) as placement_percentage
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN applications a ON u.id = a.student_id
      LEFT JOIN interviews i ON u.id = i.student_id
      LEFT JOIN placements pl ON u.id = pl.student_id
      WHERE u.role = 'student'
      GROUP BY p.year_of_study
      ORDER BY p.year_of_study
    `);

    res.status(200).json({
      overall_statistics: overallStats.rows[0] || {},
      activity_by_branch: activityByBranch.rows || [],
      activity_by_year: activityByYear.rows || []
    });

  } catch (error) {
    console.error('Get students report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/reports/me - Student's own summary (Student only)
const getMyReport = async (req, res) => {
  try {
    const student_id = req.user.id;

    // Student's application summary with normalized statuses
    const applicationSummary = await db.query(`
      SELECT 
        COUNT(a.id) as total_applications,
        COUNT(CASE WHEN a.status IN ('applied') THEN 1 END) as applied_count,
        COUNT(CASE WHEN a.status IN ('reviewed', 'round1_qualified', 'round2_qualified', 'shortlisted', 'offered') THEN 1 END) as shortlisted_count,
        COUNT(CASE WHEN a.status IN ('placed', 'hired') THEN 1 END) as placed_count,
        COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected_count
      FROM applications a
      WHERE a.student_id = $1
    `, [student_id]);

    // Student's interview summary
    const interviewSummary = await db.query(`
      SELECT 
        COUNT(i.id) as total_interviews,
        COUNT(CASE WHEN i.status = 'scheduled' THEN 1 END) as scheduled_count,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN i.status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN i.mode = 'online' THEN 1 END) as online_count,
        COUNT(CASE WHEN i.mode = 'offline' THEN 1 END) as offline_count
      FROM interviews i
      WHERE i.student_id = $1
    `, [student_id]);

    // Student's placement summary
    const placementSummary = await db.query(`
      SELECT 
        COUNT(p.id) as total_placements,
        COUNT(CASE WHEN p.status = 'offered' THEN 1 END) as offered_count,
        COUNT(CASE WHEN p.status = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN p.status = 'joined' THEN 1 END) as joined_count,
        COUNT(CASE WHEN p.status = 'declined' THEN 1 END) as declined_count,
        MAX(p.package) as highest_package_offered
      FROM placements p
      WHERE p.student_id = $1
    `, [student_id]);

    // Recent activity (last 30 days) - simplified to avoid complex UNION issues
    const recentApplications = await db.query(`
      SELECT 
        'application' as activity_type,
        a.created_at as activity_date,
        j.title as job_title,
        c.name as company_name,
        a.status as current_status
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.student_id = $1 AND a.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [student_id]);

    const recentInterviews = await db.query(`
      SELECT 
        'interview' as activity_type,
        i.scheduled_at as activity_date,
        'Interview' as job_title,
        c.name as company_name,
        i.status as current_status
      FROM interviews i
      JOIN companies c ON i.company_id = c.id
      WHERE i.student_id = $1 AND i.scheduled_at >= NOW() - INTERVAL '30 days'
      ORDER BY i.scheduled_at DESC
      LIMIT 10
    `, [student_id]);

    const recentPlacements = await db.query(`
      SELECT 
        'placement' as activity_type,
        p.created_at as activity_date,
        j.title as job_title,
        c.name as company_name,
        p.status as current_status
      FROM placements p
      JOIN jobs j ON p.job_id = j.id
      JOIN companies c ON p.company_id = c.id
      WHERE p.student_id = $1 AND p.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY p.created_at DESC
      LIMIT 10
    `, [student_id]);

    // Combine and sort all activities
    const allActivities = [
      ...recentApplications.rows,
      ...recentInterviews.rows,
      ...recentPlacements.rows
    ].sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date)).slice(0, 20);

    res.status(200).json({
      applications: applicationSummary.rows[0] || {},
      interviews: interviewSummary.rows[0] || {},
      placements: placementSummary.rows[0] || {},
      recent_activity: allActivities || []
    });

  } catch (error) {
    console.error('Get my report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getApplicationsReport,
  getInterviewsReport,
  getPlacementsReport,
  getStudentsReport,
  getMyReport
};
