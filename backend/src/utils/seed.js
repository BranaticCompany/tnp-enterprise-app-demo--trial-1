require('dotenv').config();
const db = require('./database');
const argon2 = require('argon2');

// Demo data arrays
const branches = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];
const years = [3, 4];
const skills = [
    'JavaScript, React, Node.js',
    'Python, Django, Machine Learning',
    'Java, Spring Boot, Microservices',
    'C++, Data Structures, Algorithms',
    'HTML, CSS, Bootstrap, jQuery',
    'Angular, TypeScript, MongoDB',
    'React Native, Flutter, Mobile Development',
    'DevOps, Docker, Kubernetes, AWS'
];

const companies = [
    {
        name: 'TechCorp Solutions',
        description: 'Leading technology solutions provider specializing in enterprise software and cloud services',
        website: 'https://techcorp-solutions.com'
    },
    {
        name: 'InnovateLabs Inc',
        description: 'Cutting-edge research and development company focused on AI and machine learning',
        website: 'https://innovatelabs.com'
    },
    {
        name: 'DataFlow Systems',
        description: 'Big data analytics and business intelligence solutions for Fortune 500 companies',
        website: 'https://dataflow-systems.com'
    },
    {
        name: 'Microsoft India',
        description: 'Global technology leader providing cloud computing, productivity software, and enterprise solutions',
        website: 'https://microsoft.com/en-in'
    },
    {
        name: 'Amazon Development Centre',
        description: 'Leading e-commerce and cloud computing company with focus on innovation and customer obsession',
        website: 'https://amazon.jobs/en/teams/amazon-development-centre-india'
    },
    {
        name: 'Google India',
        description: 'Technology company specializing in internet services, search, cloud computing, and advertising',
        website: 'https://careers.google.com/locations/india/'
    },
    {
        name: 'Infosys Limited',
        description: 'Global leader in next-generation digital services and consulting with focus on digital transformation',
        website: 'https://infosys.com'
    },
    {
        name: 'Tata Consultancy Services',
        description: 'Leading global IT services, consulting and business solutions organization',
        website: 'https://tcs.com'
    }
];

const jobTitles = [
    'Software Engineer Intern',
    'Full Stack Developer',
    'Data Scientist',
    'Frontend Developer',
    'Backend Engineer',
    'DevOps Engineer',
    'Machine Learning Engineer'
];

// Utility functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomElements = (array, count) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const generateCGPA = () => (Math.random() * 2 + 7).toFixed(2); // 7.00 to 9.00
const generatePackage = () => {
    // Return consistent salary values for testing
    const salaries = [800000, 700000, 600000, 900000, 1200000]; // 8L, 7L, 6L, 9L, 12L
    return salaries[Math.floor(Math.random() * salaries.length)];
};

const getFutureDate = (daysFromNow) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
};

const getPastDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
};

async function clearDatabase() {
    console.log('🧹 Clearing existing data...');

    // Clear in reverse dependency order
    await db.query('DELETE FROM placements WHERE 1=1');
    await db.query('DELETE FROM interviews WHERE 1=1');
    await db.query('DELETE FROM applications WHERE 1=1');
    await db.query('DELETE FROM jobs WHERE 1=1');
    await db.query('DELETE FROM companies WHERE 1=1');
    await db.query('DELETE FROM profiles WHERE 1=1');
    await db.query('DELETE FROM refresh_tokens WHERE 1=1');
    await db.query('DELETE FROM users WHERE 1=1');

    console.log('✅ Database cleared');
}

async function seedUsers() {
    console.log('👥 Seeding users...');

    const hashedPassword = await argon2.hash('password123');
    console.log(`🔐 Password hash type: ${hashedPassword.startsWith('$argon2') ? 'argon2 ✅' : 'plain text ❌'}`);
    console.log(`🔐 Sample hash: ${hashedPassword.substring(0, 50)}...`);
    const users = [];

    // Create admin user
    const adminResult = await db.query(`
        INSERT INTO users (email, password_hash, role, is_verified) 
        VALUES ($1, $2, $3, $4) RETURNING *
    `, ['admin@tnp.edu', hashedPassword, 'admin', true]);
    users.push(adminResult.rows[0]);

    // Create recruiter user
    const recruiterResult = await db.query(`
        INSERT INTO users (email, password_hash, role, is_verified) 
        VALUES ($1, $2, $3, $4) RETURNING *
    `, ['recruiter@techcorp.com', hashedPassword, 'recruiter', true]);
    users.push(recruiterResult.rows[0]);

    // Create student users
    const studentNames = [
        'John Doe', 'Jane Smith', 'Rahul Sharma', 'Priya Patel',
        'Michael Johnson', 'Sarah Wilson', 'Amit Kumar', 'Sneha Reddy'
    ];

    const studentUsers = studentNames.map(name => ({
        email: `${name.toLowerCase().replace(' ', '.')}@student.edu`,
        password_hash: hashedPassword,
        role: 'student',
        is_verified: true
    }));

    const userInsertPromises = studentUsers.map(user =>
        db.query(
            'INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4) RETURNING *',
            [user.email, user.password_hash, user.role, user.is_verified]
        )
    );

    const studentResults = await Promise.all(userInsertPromises);
    users.push(...studentResults.map(result => result.rows[0]));

    console.log(` Created ${users.length} users`);
    return users;
}

async function seedProfiles(users) {
    console.log('📋 Seeding profiles...');

    const students = users.filter(user => user.role === 'student');
    const profiles = [];

    const studentData = [
        { name: 'John Doe', phone: '9876543210', branch: 'Computer Science', year: 4, resumeFile: 'john_doe_resume.pdf' },
        { name: 'Jane Smith', phone: '9876543211', branch: 'Electronics', year: 4, resumeFile: 'jane_smith_resume.pdf' },
        { name: 'Rahul Sharma', phone: '9876543212', branch: 'Computer Science', year: 3, resumeFile: null },
        { name: 'Priya Patel', phone: '9876543213', branch: 'Information Technology', year: 4, resumeFile: 'alex_johnson_resume.pdf' },
        { name: 'Michael Johnson', phone: '9876543214', branch: 'Mechanical', year: 3, resumeFile: null },
        { name: 'Sarah Wilson', phone: '9876543215', branch: 'Electronics', year: 4, resumeFile: null },
        { name: 'Amit Kumar', phone: '9876543216', branch: 'Computer Science', year: 3, resumeFile: null },
        { name: 'Sneha Reddy', phone: '9876543217', branch: 'Civil', year: 4, resumeFile: null }
    ];

    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const data = studentData[i];

        // Set resume_url based on whether student has a resume file
        const resumeUrl = data.resumeFile ? `uploads/resumes/${data.resumeFile}` : null;

        // Generate a realistic CGPA between 6.5 and 9.5
        const cgpa = (Math.random() * 3 + 6.5).toFixed(2);

        const profileResult = await db.query(`
            INSERT INTO profiles (user_id, full_name, phone, branch, year_of_study, cgpa, resume_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [
            student.id,
            data.name,
            data.phone,
            data.branch,
            data.year,
            parseFloat(cgpa),
            resumeUrl
        ]);
        profiles.push(profileResult.rows[0]);
    }

    console.log(`✅ Created ${profiles.length} profiles`);
    return profiles;
}

async function seedCompanies() {
    console.log('🏢 Seeding companies...');

    const companyRecords = [];

    for (const company of companies) {
        const result = await db.query(`
            INSERT INTO companies (name, description, website) 
            VALUES ($1, $2, $3) RETURNING *
        `, [company.name, company.description, company.website]);
        companyRecords.push(result.rows[0]);
    }

    console.log(`✅ Created ${companyRecords.length} companies`);
    return companyRecords;
}

async function seedJobs(companyRecords) {
    console.log('💼 Seeding jobs...');

    const jobs = [];

    // Comprehensive job data with exactly 10 diverse positions
    const jobData = [
        {
            title: 'Software Engineer Intern',
            description: 'Join our dynamic team as a software engineering intern. Work on real-world projects using modern technologies like React, Node.js, and cloud platforms. Gain hands-on experience in agile development.',
            eligibility: 'Computer Science/IT students in 3rd/4th year with good programming skills in Java/Python/JavaScript',
            deadline: getFutureDate(15), // 15 days from now
            companyIndex: 0, // TechCorp Solutions
            package: 25000, // Monthly stipend for internship
            type: 'Internship',
            location: 'Bangalore, India',
            cgpa_criteria: 7.0
        },
        {
            title: 'Full Stack Developer',
            description: 'Develop end-to-end web applications using React, Node.js, and modern databases. Work with cross-functional teams to deliver scalable solutions.',
            eligibility: 'Final year students with web development experience and portfolio of projects',
            deadline: getFutureDate(30), // 30 days from now
            companyIndex: 1, // InnovateLabs Inc
            package: 800000, // 8 LPA
            type: 'Full Time',
            location: 'Mumbai, India',
            cgpa_criteria: 7.5
        },
        {
            title: 'Data Scientist',
            description: 'Analyze large datasets and build machine learning models to drive business insights. Work with Python, R, SQL, and modern ML frameworks.',
            eligibility: 'Students with strong mathematics, statistics and Python programming skills',
            deadline: getFutureDate(45), // 45 days from now
            companyIndex: 2, // DataFlow Systems
            package: 1200000, // 12 LPA
            type: 'Full Time',
            location: 'Hyderabad, India',
            cgpa_criteria: 8.0
        },
        {
            title: 'Frontend Developer',
            description: 'Create beautiful and responsive user interfaces using React, Angular, or Vue.js. Focus on user experience and modern design principles.',
            eligibility: 'Students with frontend development skills, design sense, and knowledge of modern frameworks',
            deadline: getFutureDate(7), // 7 days from now (urgent)
            companyIndex: 3, // Microsoft India
            package: 1500000, // 15 LPA
            type: 'Full Time',
            location: 'Noida, India',
            cgpa_criteria: 8.5
        },
        {
            title: 'Cloud Engineer Intern',
            description: 'Learn and work with AWS/Azure cloud platforms. Assist in managing infrastructure, deployment pipelines, and monitoring systems.',
            eligibility: 'Students familiar with cloud platforms, Linux, and basic networking concepts',
            deadline: getFutureDate(20), // 20 days from now
            companyIndex: 4, // Amazon Development Centre
            package: 40000, // Monthly stipend for internship
            type: 'Internship',
            location: 'Chennai, India',
            cgpa_criteria: 7.0
        },
        {
            title: 'Software Development Engineer',
            description: 'Design and develop scalable software systems. Work on distributed systems, algorithms, and system design challenges.',
            eligibility: 'Computer Science students with strong problem-solving skills and knowledge of data structures',
            deadline: getFutureDate(35), // 35 days from now
            companyIndex: 5, // Google India
            package: 2200000, // 22 LPA
            type: 'Full Time',
            location: 'Gurgaon, India',
            cgpa_criteria: 8.5
        },
        {
            title: 'Business Analyst',
            description: 'Bridge the gap between business and technology. Analyze requirements, create documentation, and work with stakeholders.',
            eligibility: 'Students with good communication skills, analytical thinking, and basic technical knowledge',
            deadline: getFutureDate(25), // 25 days from now
            companyIndex: 6, // Infosys Limited
            package: 600000, // 6 LPA
            type: 'Full Time',
            location: 'Pune, India',
            cgpa_criteria: 7.0
        },
        {
            title: 'Quality Assurance Engineer',
            description: 'Ensure software quality through manual and automated testing. Design test cases, execute tests, and report bugs.',
            eligibility: 'Students with attention to detail, basic programming knowledge, and understanding of SDLC',
            deadline: getFutureDate(40), // 40 days from now
            companyIndex: 7, // Tata Consultancy Services
            package: 500000, // 5 LPA
            type: 'Full Time',
            location: 'Kolkata, India',
            cgpa_criteria: 6.5
        },
        {
            title: 'Machine Learning Engineer',
            description: 'Build and deploy ML models at scale. Work with large datasets, model optimization, and production ML systems.',
            eligibility: 'Students with strong mathematics, Python/R programming, and machine learning fundamentals',
            deadline: getFutureDate(50), // 50 days from now
            companyIndex: 1, // InnovateLabs Inc
            package: 1800000, // 18 LPA
            type: 'Full Time',
            location: 'Bangalore, India',
            cgpa_criteria: 8.0
        },
        {
            title: 'Product Management Intern',
            description: 'Learn product strategy, market research, and feature planning. Work closely with engineering and design teams.',
            eligibility: 'Students with good analytical skills, communication abilities, and interest in technology products',
            deadline: getFutureDate(12), // 12 days from now
            companyIndex: 0, // TechCorp Solutions
            package: null, // Not specified
            type: 'Internship',
            location: 'Delhi, India',
            cgpa_criteria: 7.5
        }
    ];

    // Insert all 10 jobs with package and type fields
    for (let i = 0; i < jobData.length; i++) {
        const job = jobData[i];
        const company = companyRecords[job.companyIndex % companyRecords.length];

        // Define skills for each job
        const jobSkills = {
            'Software Engineer Intern': ['JavaScript', 'Python', 'Git', 'Problem Solving'],
            'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'MongoDB', 'REST API'],
            'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Data Analysis', 'PostgreSQL'],
            'Frontend Developer': ['React', 'HTML', 'CSS', 'JavaScript', 'Communication'],
            'Cloud Engineer Intern': ['AWS', 'Linux', 'Docker', 'DevOps'],
            'Software Development Engineer': ['Java', 'Data Structures', 'Algorithms', 'System Design'],
            'Business Analyst': ['Communication', 'MS Excel', 'Problem Solving', 'SQL'],
            'Quality Assurance Engineer': ['Testing', 'Selenium', 'Java', 'SDLC'],
            'Machine Learning Engineer': ['Python', 'TensorFlow', 'Deep Learning', 'MLOps', 'Statistics'],
            'Product Management Intern': ['Communication', 'Project Management', 'Analytics', 'Leadership']
        };

        const skills = jobSkills[job.title] || [];

        const result = await db.query(`
            INSERT INTO jobs (company_id, company_name, title, description, eligibility, application_deadline, package, type, location, cgpa_criteria, skills) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
        `, [company.id, company.name, job.title, job.description, job.eligibility, job.deadline, job.package, job.type, job.location, job.cgpa_criteria, JSON.stringify(skills)]);

        // Add company name for reference
        const jobWithCompany = {
            ...result.rows[0],
            company_name: company.name
        };

        jobs.push(jobWithCompany);
    }

    console.log(`✅ Created ${jobs.length} jobs`);
    return jobs;
}

async function seedApplications(students, jobs) {
    console.log('📝 Seeding applications...');

    const applications = [];

    // Define comprehensive application scenarios for multiple students
    // Using actual student emails: john.doe, jane.smith, rahul.sharma, priya.patel, michael.johnson, sarah.wilson, amit.kumar, sneha.reddy
    const applicationScenarios = [
        // John Doe - 4 applications with different statuses
        { studentEmail: 'john.doe@student.edu', jobTitle: 'Software Engineer Intern', status: 'applied' },
        { studentEmail: 'john.doe@student.edu', jobTitle: 'Full Stack Developer', status: 'shortlisted' },
        { studentEmail: 'john.doe@student.edu', jobTitle: 'Data Scientist', status: 'rejected' },
        { studentEmail: 'john.doe@student.edu', jobTitle: 'Frontend Developer', status: 'placed' },

        // Jane Smith - 3 applications
        { studentEmail: 'jane.smith@student.edu', jobTitle: 'Software Engineer Intern', status: 'placed' },
        { studentEmail: 'jane.smith@student.edu', jobTitle: 'Backend Engineer', status: 'shortlisted' },
        { studentEmail: 'jane.smith@student.edu', jobTitle: 'DevOps Engineer', status: 'applied' },

        // Rahul Sharma - 3 applications
        { studentEmail: 'rahul.sharma@student.edu', jobTitle: 'Data Scientist', status: 'placed' },
        { studentEmail: 'rahul.sharma@student.edu', jobTitle: 'Machine Learning Engineer', status: 'shortlisted' },
        { studentEmail: 'rahul.sharma@student.edu', jobTitle: 'Full Stack Developer', status: 'rejected' },

        // Priya Patel - 4 applications
        { studentEmail: 'priya.patel@student.edu', jobTitle: 'Full Stack Developer', status: 'placed' },
        { studentEmail: 'priya.patel@student.edu', jobTitle: 'Frontend Developer', status: 'shortlisted' },
        { studentEmail: 'priya.patel@student.edu', jobTitle: 'Software Engineer Intern', status: 'applied' },
        { studentEmail: 'priya.patel@student.edu', jobTitle: 'Backend Engineer', status: 'rejected' },

        // Michael Johnson - 3 applications
        { studentEmail: 'michael.johnson@student.edu', jobTitle: 'DevOps Engineer', status: 'placed' },
        { studentEmail: 'michael.johnson@student.edu', jobTitle: 'Backend Engineer', status: 'shortlisted' },
        { studentEmail: 'michael.johnson@student.edu', jobTitle: 'Software Engineer Intern', status: 'applied' },

        // Sarah Wilson - 2 applications
        { studentEmail: 'sarah.wilson@student.edu', jobTitle: 'Machine Learning Engineer', status: 'placed' },
        { studentEmail: 'sarah.wilson@student.edu', jobTitle: 'Data Scientist', status: 'shortlisted' },

        // Amit Kumar - 3 applications (no placements)
        { studentEmail: 'amit.kumar@student.edu', jobTitle: 'Frontend Developer', status: 'shortlisted' },
        { studentEmail: 'amit.kumar@student.edu', jobTitle: 'Software Engineer Intern', status: 'applied' },
        { studentEmail: 'amit.kumar@student.edu', jobTitle: 'Full Stack Developer', status: 'rejected' },

        // Sneha Reddy - 2 applications (no placements)
        { studentEmail: 'sneha.reddy@student.edu', jobTitle: 'Backend Engineer', status: 'applied' },
        { studentEmail: 'sneha.reddy@student.edu', jobTitle: 'DevOps Engineer', status: 'rejected' }
    ];

    // Create applications for each scenario
    for (const scenario of applicationScenarios) {
        const student = students.find(s => s.email === scenario.studentEmail);
        if (!student) {
            console.log(`⚠️ Student ${scenario.studentEmail} not found, skipping application`);
            continue;
        }

        const job = jobs.find(j => j.title === scenario.jobTitle);
        if (!job) {
            console.log(`⚠️ Job ${scenario.jobTitle} not found, skipping application`);
            continue;
        }

        // Create application
        const result = await db.query(`
            INSERT INTO applications (student_id, job_id, status) 
            VALUES ($1, $2, $3) RETURNING *
        `, [student.id, job.id, scenario.status]);
        
        applications.push(result.rows[0]);
        console.log(`✅ Created application: ${scenario.studentEmail} → ${scenario.jobTitle} (${scenario.status})`);
    }

    console.log(`✅ Created ${applications.length} applications across ${new Set(applicationScenarios.map(s => s.studentEmail)).size} students`);
    
    // Show status distribution
    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});
    console.log('📊 Application status distribution:', statusCounts);
    
    return applications;
}

async function seedInterviews(applications, companies) {
    console.log('🎤 Seeding interviews...');

    const interviews = [];
    const modes = ['online', 'offline'];

    // Define interview scenarios for shortlisted and placed applications
    const interviewScenarios = [
        // Scheduled interviews (future dates)
        { studentEmail: 'john.doe@student.edu', jobTitle: 'Full Stack Developer', status: 'scheduled', mode: 'online', daysFromNow: 3, feedback: null },
        { studentEmail: 'jane.smith@student.edu', jobTitle: 'Backend Engineer', status: 'scheduled', mode: 'offline', daysFromNow: 5, feedback: null },
        { studentEmail: 'rahul.sharma@student.edu', jobTitle: 'Machine Learning Engineer', status: 'scheduled', mode: 'online', daysFromNow: 7, feedback: null },
        { studentEmail: 'priya.patel@student.edu', jobTitle: 'Frontend Developer', status: 'scheduled', mode: 'offline', daysFromNow: 4, feedback: null },
        { studentEmail: 'michael.johnson@student.edu', jobTitle: 'Backend Engineer', status: 'scheduled', mode: 'online', daysFromNow: 6, feedback: null },
        { studentEmail: 'sarah.wilson@student.edu', jobTitle: 'Data Scientist', status: 'scheduled', mode: 'offline', daysFromNow: 8, feedback: null },
        { studentEmail: 'amit.kumar@student.edu', jobTitle: 'Frontend Developer', status: 'scheduled', mode: 'online', daysFromNow: 2, feedback: null },

        // Completed interviews (future dates but marked as completed) - for placed students
        { studentEmail: 'john.doe@student.edu', jobTitle: 'Frontend Developer', status: 'completed', mode: 'online', daysFromNow: 1, feedback: 'Excellent technical skills and problem-solving approach. Strong candidate for the role. Recommended for placement.' },
        { studentEmail: 'jane.smith@student.edu', jobTitle: 'Software Engineer Intern', status: 'completed', mode: 'offline', daysFromNow: 2, feedback: 'Good understanding of fundamentals. Shows potential for growth. Suitable for internship role.' },
        { studentEmail: 'rahul.sharma@student.edu', jobTitle: 'Data Scientist', status: 'completed', mode: 'online', daysFromNow: 3, feedback: 'Outstanding analytical skills and machine learning knowledge. Perfect fit for the data science role.' },
        { studentEmail: 'priya.patel@student.edu', jobTitle: 'Full Stack Developer', status: 'completed', mode: 'offline', daysFromNow: 4, feedback: 'Strong full-stack development skills. Great communication and problem-solving abilities.' },
        { studentEmail: 'michael.johnson@student.edu', jobTitle: 'DevOps Engineer', status: 'completed', mode: 'online', daysFromNow: 5, feedback: 'Excellent DevOps knowledge and automation skills. Strong understanding of cloud platforms.' },
        { studentEmail: 'sarah.wilson@student.edu', jobTitle: 'Machine Learning Engineer', status: 'completed', mode: 'offline', daysFromNow: 6, feedback: 'Exceptional ML expertise and research background. Highly recommended for the ML engineer position.' }
    ];

    // Create interviews for each scenario
    for (const scenario of interviewScenarios) {
        // Find the corresponding application
        const application = applications.find(app => {
            // We need to match by student email and job title
            // Since we don't have direct access to student email in application object,
            // we'll find it through the students array
            return true; // We'll handle this in the loop below
        });

        // Get student and job info to find the right application
        const studentsResult = await db.query('SELECT id, email FROM users WHERE email = $1', [scenario.studentEmail]);
        if (studentsResult.rows.length === 0) continue;
        
        const student = studentsResult.rows[0];
        const job = await db.query('SELECT id FROM jobs WHERE title = $1', [scenario.jobTitle]);
        if (job.rows.length === 0) continue;

        // Find the specific application
        const app = applications.find(a => a.student_id === student.id && a.job_id === job.rows[0].id);
        if (!app) continue;

        // Only create interviews for shortlisted or placed applications
        if (!['shortlisted', 'placed'].includes(app.status)) continue;

        // Get job info to find company
        const jobResult = await db.query('SELECT company_id FROM jobs WHERE id = $1', [app.job_id]);
        if (jobResult.rows.length === 0) continue;

        const company_id = jobResult.rows[0].company_id;
        const scheduledDate = getFutureDate(scenario.daysFromNow);

        // Create interview
        const result = await db.query(`
            INSERT INTO interviews (application_id, student_id, company_id, scheduled_at, mode, status, feedback) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [
            app.id,
            student.id,
            company_id,
            scheduledDate,
            scenario.mode,
            scenario.status,
            scenario.feedback
        ]);

        interviews.push(result.rows[0]);
        console.log(`✅ Created interview: ${scenario.studentEmail} → ${scenario.jobTitle} (${scenario.status}, ${scenario.mode})`);
    }

    console.log(`✅ Created ${interviews.length} interviews across multiple students`);
    
    // Show interview distribution
    const interviewCounts = interviews.reduce((acc, interview) => {
        acc[interview.status] = (acc[interview.status] || 0) + 1;
        return acc;
    }, {});
    console.log('📊 Interview status distribution:', interviewCounts);
    
    return interviews;
}

async function seedPlacements(applications, jobs) {
    console.log('🎯 Seeding placements...');

    const placements = [];

    // Get all students for placement assignments
    const studentsResult = await db.query('SELECT id, email FROM users WHERE role = $1', ['student']);
    const students = studentsResult.rows;

    // Define placement scenarios with different salary ranges
    const placementScenarios = [
        {
            studentEmail: 'john.doe@student.edu',
            jobTitle: 'Frontend Developer',
            package: 1500000, // ₹15L - 10-20L range
            status: 'accepted'
        },
        {
            studentEmail: 'jane.smith@student.edu',
            jobTitle: 'Software Engineer Intern',
            package: 400000, // ₹4L - 0-5L range
            status: 'accepted'
        },
        {
            studentEmail: 'rahul.sharma@student.edu',
            jobTitle: 'Data Scientist',
            package: 2200000, // ₹22L - 20+L range
            status: 'accepted'
        },
        {
            studentEmail: 'priya.patel@student.edu',
            jobTitle: 'Full Stack Developer',
            package: 800000, // ₹8L - 5-10L range
            status: 'accepted'
        },
        {
            studentEmail: 'michael.johnson@student.edu',
            jobTitle: 'DevOps Engineer',
            package: 1800000, // ₹18L - 10-20L range
            status: 'accepted'
        },
        {
            studentEmail: 'sarah.wilson@student.edu',
            jobTitle: 'Machine Learning Engineer',
            package: 2500000, // ₹25L - 20+L range
            status: 'joined'
        }
    ];

    // Create placements for each scenario
    for (const scenario of placementScenarios) {
        const student = students.find(s => s.email === scenario.studentEmail);
        if (!student) {
            console.log(`⚠️ Student ${scenario.studentEmail} not found, skipping placement`);
            continue;
        }

        // Find the job
        const job = jobs.find(j => j.title === scenario.jobTitle);
        if (!job) {
            console.log(`⚠️ Job ${scenario.jobTitle} not found, skipping placement`);
            continue;
        }

        // Check if there's an application for this student-job combination
        const application = applications.find(app => 
            app.student_id === student.id && app.job_id === job.id
        );

        if (application) {
            // Update application status to 'placed'
            await db.query(
                'UPDATE applications SET status = $1 WHERE id = $2',
                ['placed', application.id]
            );

            // Get job details for placement
            const jobResult = await db.query(
                'SELECT id, company_id, title FROM jobs WHERE id = $1',
                [job.id]
            );

            if (jobResult.rows.length > 0) {
                const jobData = jobResult.rows[0];

                // Create placement record
                const result = await db.query(`
                    INSERT INTO placements (student_id, job_id, company_id, package, role, status) 
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
                `, [
                    student.id,
                    jobData.id,
                    jobData.company_id,
                    scenario.package,
                    jobData.title,
                    scenario.status
                ]);
                placements.push(result.rows[0]);
                console.log(`✅ Created placement: ${scenario.studentEmail} → ${scenario.jobTitle} (₹${scenario.package/100000}L)`);
            }
        } else {
            // Create application first, then placement
            const appResult = await db.query(`
                INSERT INTO applications (student_id, job_id, status) 
                VALUES ($1, $2, $3) RETURNING *
            `, [student.id, job.id, 'placed']);

            const jobResult = await db.query(
                'SELECT id, company_id, title FROM jobs WHERE id = $1',
                [job.id]
            );

            if (jobResult.rows.length > 0) {
                const jobData = jobResult.rows[0];

                const result = await db.query(`
                    INSERT INTO placements (student_id, job_id, company_id, package, role, status) 
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
                `, [
                    student.id,
                    jobData.id,
                    jobData.company_id,
                    scenario.package,
                    jobData.title,
                    scenario.status
                ]);
                placements.push(result.rows[0]);
                console.log(`✅ Created placement: ${scenario.studentEmail} → ${scenario.jobTitle} (₹${scenario.package/100000}L)`);
            }
        }
    }

    console.log(`✅ Created ${placements.length} placements across different salary ranges`);
    return placements;
}

async function main() {
    try {
        console.log('🚀 Starting TnP Portal database seeding...\n');

        // Clear existing data
        await clearDatabase();

        // Seed data in dependency order
        const users = await seedUsers();
        const profiles = await seedProfiles(users);
        const companyRecords = await seedCompanies();
        const jobs = await seedJobs(companyRecords);

        const students = users.filter(user => user.role === 'student');
        const applications = await seedApplications(students, jobs);
        const interviews = await seedInterviews(applications, companyRecords);
        const placements = await seedPlacements(applications, jobs);

        // Summary
        console.log('\n🎉 Seed complete!');
        console.log(`✅ ${users.length} users (${students.length} students, 1 recruiter, 1 admin)`);
        console.log(`✅ ${profiles.length} profiles`);
        console.log(`✅ ${companyRecords.length} companies`);
        console.log(`✅ ${jobs.length} jobs`);
        console.log(`✅ ${applications.length} applications`);
        console.log(`✅ ${interviews.length} interviews`);
        console.log(`✅ ${placements.length} placements`);

        console.log('\n📊 Demo data ready! You can now:');
        console.log('- Test the reports endpoints (/api/v1/reports/...)');
        console.log('- Login with: admin@tnp.edu / password123 (admin)');
        console.log('- Login with: recruiter@techcorp.com / password123 (recruiter)');
        console.log('- Login with: john.doe@student.edu / password123 (student)');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        // Note: Database pool will close automatically when process exits
        console.log('\n🔌 Database seeding completed');
        process.exit(0);
    }
}

// Run the seeding script
if (require.main === module) {
    main();
}

module.exports = { main };
