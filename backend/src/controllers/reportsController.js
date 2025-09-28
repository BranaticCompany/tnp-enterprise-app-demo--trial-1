const { query } = require('../utils/database');

/**
 * Get overall summary statistics for admin dashboard
 * GET /api/v1/admin/reports/summary
 */
const getSummaryStats = async (req, res) => {
  try {
    console.log('=== REPORTS SUMMARY DEBUG ===');
    
    let totalStudents = 0;
    let placedStudents = 0;
    let totalCompanies = 0;
    let totalJobs = 0;
    let totalApplications = 0;
    let totalInterviews = 0;
    let avgPackage = 0;

    try {
      // Get total students count
      const studentsQuery = `SELECT COUNT(*) as total_students FROM users WHERE role = 'student'`;
      const studentsResult = await query(studentsQuery);
      totalStudents = parseInt(studentsResult.rows[0].total_students) || 0;
      console.log('Total students:', totalStudents);
    } catch (err) {
      console.log('Error getting students count:', err.message);
    }

    try {
      // Get placed students count (handle if placements table doesn't exist)
      // Check what statuses exist in placements table
      const statusCheckQuery = `SELECT DISTINCT status FROM placements`;
      const statusResult = await query(statusCheckQuery);
      console.log('Available placement statuses:', statusResult.rows.map(r => r.status));
      
      const placedQuery = `SELECT COUNT(DISTINCT student_id) as placed_students FROM placements WHERE status IN ('accepted', 'joined', 'offered')`;
      const placedResult = await query(placedQuery);
      placedStudents = parseInt(placedResult.rows[0].placed_students) || 0;
      console.log('Placed students:', placedStudents);
      
      // Also get all placements for debugging
      const allPlacementsQuery = `SELECT student_id, status, role, package FROM placements`;
      const allPlacements = await query(allPlacementsQuery);
      console.log('All placements:', allPlacements.rows);
    } catch (err) {
      console.log('Error getting placed students (placements table may not exist):', err.message);
      placedStudents = 0;
    }

    try {
      // Get total companies count
      const companiesQuery = `SELECT COUNT(*) as total_companies FROM companies`;
      const companiesResult = await query(companiesQuery);
      totalCompanies = parseInt(companiesResult.rows[0].total_companies) || 0;
      console.log('Total companies:', totalCompanies);
    } catch (err) {
      console.log('Error getting companies count:', err.message);
    }

    try {
      // Get total jobs count
      const jobsQuery = `SELECT COUNT(*) as total_jobs FROM jobs`;
      const jobsResult = await query(jobsQuery);
      totalJobs = parseInt(jobsResult.rows[0].total_jobs) || 0;
      console.log('Total jobs:', totalJobs);
    } catch (err) {
      console.log('Error getting jobs count:', err.message);
    }

    try {
      // Get total applications count
      const applicationsQuery = `SELECT COUNT(*) as total_applications FROM applications`;
      const applicationsResult = await query(applicationsQuery);
      totalApplications = parseInt(applicationsResult.rows[0].total_applications) || 0;
      console.log('Total applications:', totalApplications);
    } catch (err) {
      console.log('Error getting applications count:', err.message);
    }

    try {
      // Get total interviews count
      const interviewsQuery = `SELECT COUNT(*) as total_interviews FROM interviews`;
      const interviewsResult = await query(interviewsQuery);
      totalInterviews = parseInt(interviewsResult.rows[0].total_interviews) || 0;
      console.log('Total interviews:', totalInterviews);
    } catch (err) {
      console.log('Error getting interviews count:', err.message);
    }

    try {
      // Get average package from placements
      const avgPackageQuery = `
        SELECT AVG(
          CASE 
            WHEN package IS NOT NULL AND package > 0 THEN package
            ELSE NULL
          END
        ) as avg_package
        FROM placements
        WHERE status IN ('accepted', 'joined', 'offered')
      `;
      const avgPackageResult = await query(avgPackageQuery);
      avgPackage = avgPackageResult.rows[0].avg_package 
        ? parseFloat(avgPackageResult.rows[0].avg_package / 100000).toFixed(1) // Convert to lakhs
        : 0;
      console.log('Average package (lakhs):', avgPackage);
      console.log('Raw average package:', avgPackageResult.rows[0].avg_package);
    } catch (err) {
      console.log('Error getting average package:', err.message);
    }

    // Calculate placement rate
    const placementRate = totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(1) : 0;

    const summary = {
      total_students: totalStudents,
      placed_students: placedStudents,
      placement_rate: parseFloat(placementRate),
      total_companies: totalCompanies,
      total_jobs: totalJobs,
      total_applications: totalApplications,
      total_interviews: totalInterviews,
      avg_package: parseFloat(avgPackage)
    };

    console.log('Final summary stats:', summary);
    res.json(summary);

  } catch (error) {
    console.error('=== REPORTS SUMMARY ERROR ===');
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch summary statistics',
      details: error.message 
    });
  }
};

/**
 * Get applications grouped by company
 * GET /api/v1/admin/reports/applications-by-company
 */
const getApplicationsByCompany = async (req, res) => {
  try {
    console.log('=== APPLICATIONS BY COMPANY DEBUG ===');
    
    const queryText = `
      SELECT 
        COALESCE(j.company_name, 'Unknown Company') as company,
        COUNT(a.id) as applications
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      GROUP BY COALESCE(j.company_name, 'Unknown Company')
      ORDER BY applications DESC
      LIMIT 10
    `;

    const result = await query(queryText);
    const applicationsByCompany = result.rows.map(row => ({
      company: row.company,
      applications: parseInt(row.applications)
    }));

    console.log('Applications by company:', applicationsByCompany);
    res.json(applicationsByCompany);

  } catch (error) {
    console.error('=== APPLICATIONS BY COMPANY ERROR ===');
    console.error('Error:', error);
    // Return empty array if there's an error
    res.json([]);
  }
};

/**
 * Get package distribution for placed students
 * GET /api/v1/admin/reports/package-distribution
 */
const getPackageDistribution = async (req, res) => {
  try {
    console.log('=== PACKAGE DISTRIBUTION DEBUG ===');
    
    // Initialize distribution counters
    const distribution = {
      "0-5": 0,
      "5-10": 0,
      "10-20": 0,
      "20+": 0
    };

    try {
      const queryText = `
        SELECT 
          CASE 
            WHEN package IS NOT NULL AND package > 0 THEN package
            ELSE 0
          END as package_amount
        FROM placements
        WHERE status IN ('accepted', 'joined', 'offered')
          AND package IS NOT NULL AND package > 0
      `;

      const result = await query(queryText);
      
      // Categorize packages into ranges (convert from paisa to lakhs)
      result.rows.forEach(row => {
        const packageInLakhs = row.package_amount / 100000;
        
        if (packageInLakhs >= 0 && packageInLakhs < 5) {
          distribution["0-5"]++;
        } else if (packageInLakhs >= 5 && packageInLakhs < 10) {
          distribution["5-10"]++;
        } else if (packageInLakhs >= 10 && packageInLakhs < 20) {
          distribution["10-20"]++;
        } else if (packageInLakhs >= 20) {
          distribution["20+"]++;
        }
      });
    } catch (err) {
      console.log('Error getting package distribution (placements table may not exist):', err.message);
    }

    console.log('Package distribution:', distribution);
    res.json(distribution);

  } catch (error) {
    console.error('=== PACKAGE DISTRIBUTION ERROR ===');
    console.error('Error:', error);
    res.json({ "0-5": 0, "5-10": 0, "10-20": 0, "20+": 0 });
  }
};

/**
 * Get placement trends over time
 * GET /api/v1/admin/reports/placement-trends
 */
const getPlacementTrends = async (req, res) => {
  try {
    console.log('=== PLACEMENT TRENDS DEBUG ===');
    
    let trends = [];
    
    try {
      const queryText = `
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as placements
        FROM placements
        WHERE status IN ('accepted', 'joined', 'offered')
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC
      `;

      const result = await query(queryText);
      trends = result.rows.map(row => ({
        month: row.month.toISOString().substring(0, 7), // YYYY-MM format
        placements: parseInt(row.placements)
      }));
    } catch (err) {
      console.log('Error getting placement trends (placements table may not exist):', err.message);
    }

    console.log('Placement trends:', trends);
    res.json(trends);

  } catch (error) {
    console.error('=== PLACEMENT TRENDS ERROR ===');
    console.error('Error:', error);
    res.json([]);
  }
};

/**
 * Get application status distribution
 * GET /api/v1/admin/reports/application-status
 */
const getApplicationStatus = async (req, res) => {
  try {
    console.log('=== APPLICATION STATUS DEBUG ===');
    
    let statusDistribution = [];
    
    try {
      const queryText = `
        SELECT 
          status,
          COUNT(*) as count
        FROM applications
        GROUP BY status
        ORDER BY count DESC
      `;

      const result = await query(queryText);
      statusDistribution = result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count)
      }));
    } catch (err) {
      console.log('Error getting application status (applications table may not exist):', err.message);
    }

    console.log('Application status distribution:', statusDistribution);
    res.json(statusDistribution);

  } catch (error) {
    console.error('=== APPLICATION STATUS ERROR ===');
    console.error('Error:', error);
    res.json([]);
  }
};

module.exports = {
  getSummaryStats,
  getApplicationsByCompany,
  getPackageDistribution,
  getPlacementTrends,
  getApplicationStatus
};
