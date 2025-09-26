const pool = require('../utils/database')

// Get all users with their details
const getAllUsers = async (req, res) => {
  try {
    console.log('=== GET ALL USERS DEBUG ===')
    console.log('Admin user:', req.user?.email)

    // Query to get all users with profile data for students
    const query = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        p.full_name,
        p.branch,
        p.year_of_study,
        -- Check if student is placed (has any placement with status 'accepted')
        CASE 
          WHEN u.role = 'student' THEN 
            CASE 
              WHEN EXISTS (
                SELECT 1 FROM placements pl 
                WHERE pl.student_id = u.id AND pl.status = 'accepted'
              ) THEN true
              ELSE false
            END
          ELSE NULL
        END as placed
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `

    const result = await pool.query(query)
    
    console.log('Users found:', result.rows.length)
    
    // Transform the data for better frontend consumption
    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      name: user.full_name || user.email.split('@')[0], // Fallback to email prefix if no name
      branch: user.branch,
      year_of_study: user.year_of_study,
      placed: user.placed
    }))

    console.log('Transformed users:', users.length)

    res.json({
      success: true,
      users,
      count: users.length
    })

  } catch (error) {
    console.error('=== GET ALL USERS ERROR ===')
    console.error('Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    })
  }
}

// Get all companies with job counts
const getAllCompanies = async (req, res) => {
  try {
    console.log('=== GET ALL COMPANIES DEBUG ===')
    console.log('Admin user:', req.user?.email)

    // Query to get all companies with job counts
    const query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.website,
        c.created_at,
        -- Count jobs posted by this company
        COALESCE(job_count.total_jobs, 0) as jobs_posted
      FROM companies c
      LEFT JOIN (
        SELECT 
          company_id,
          COUNT(*) as total_jobs
        FROM jobs 
        WHERE company_id IS NOT NULL
        GROUP BY company_id
      ) job_count ON c.id = job_count.company_id
      ORDER BY c.created_at DESC
    `

    const result = await pool.query(query)
    
    console.log('Companies found:', result.rows.length)
    
    // Transform the data for better frontend consumption
    const companies = result.rows.map(company => ({
      id: company.id,
      name: company.name,
      description: company.description || 'No description',
      website: company.website || 'Not provided',
      created_at: company.created_at,
      jobs_posted: parseInt(company.jobs_posted) || 0
    }))

    console.log('Transformed companies:', companies.length)

    res.json({
      success: true,
      companies,
      count: companies.length
    })

  } catch (error) {
    console.error('=== GET ALL COMPANIES ERROR ===')
    console.error('Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    })
  }
}

// Get all students with detailed information
const getAllStudents = async (req, res) => {
  try {
    console.log('=== GET ALL STUDENTS DEBUG ===')
    console.log('Admin user:', req.user?.email)

    // Query to get all students with profile and placement data
    const query = `
      SELECT 
        u.id,
        u.email,
        u.created_at,
        p.full_name,
        p.phone,
        p.branch,
        p.year_of_study,
        p.resume_url,
        -- Check if student is placed
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM placements pl 
            WHERE pl.student_id = u.id AND pl.status = 'accepted'
          ) THEN true
          ELSE false
        END as placed,
        -- Get placement details if placed
        (
          SELECT json_build_object(
            'company_name', COALESCE(j.company_name, c.name),
            'job_title', j.title,
            'package', pl.package,
            'role', pl.role,
            'status', pl.status,
            'placed_at', pl.created_at
          )
          FROM placements pl
          LEFT JOIN jobs j ON pl.job_id = j.id
          LEFT JOIN companies c ON j.company_id = c.id
          WHERE pl.student_id = u.id AND pl.status = 'accepted'
          LIMIT 1
        ) as placement_details,
        -- Count applications
        (
          SELECT COUNT(*) 
          FROM applications a 
          WHERE a.student_id = u.id
        ) as total_applications,
        -- Count interviews
        (
          SELECT COUNT(*) 
          FROM interviews i 
          WHERE i.student_id = u.id
        ) as total_interviews
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
    `

    const result = await pool.query(query)
    
    console.log('Students found:', result.rows.length)
    
    // Transform the data for better frontend consumption
    const students = result.rows.map(student => ({
      id: student.id,
      email: student.email,
      created_at: student.created_at,
      name: student.full_name || student.email.split('@')[0],
      phone: student.phone,
      branch: student.branch,
      year_of_study: student.year_of_study,
      resume_url: student.resume_url,
      placed: student.placed,
      placement_details: student.placement_details,
      total_applications: parseInt(student.total_applications) || 0,
      total_interviews: parseInt(student.total_interviews) || 0
    }))

    console.log('Transformed students:', students.length)

    res.json({
      success: true,
      students,
      count: students.length
    })

  } catch (error) {
    console.error('=== GET ALL STUDENTS ERROR ===')
    console.error('Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error stack:', error.stack)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    })
  }
}

module.exports = {
  getAllUsers,
  getAllCompanies,
  getAllStudents
}
