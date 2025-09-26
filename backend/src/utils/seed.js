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
        { name: 'John Doe', phone: '9876543210', branch: 'Computer Science', year: 4 },
        { name: 'Jane Smith', phone: '9876543211', branch: 'Electronics', year: 4 },
        { name: 'Rahul Sharma', phone: '9876543212', branch: 'Computer Science', year: 3 },
        { name: 'Priya Patel', phone: '9876543213', branch: 'Information Technology', year: 4 },
        { name: 'Michael Johnson', phone: '9876543214', branch: 'Mechanical', year: 3 },
        { name: 'Sarah Wilson', phone: '9876543215', branch: 'Electronics', year: 4 },
        { name: 'Amit Kumar', phone: '9876543216', branch: 'Computer Science', year: 3 },
        { name: 'Sneha Reddy', phone: '9876543217', branch: 'Civil', year: 4 }
    ];

    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const data = studentData[i];

        const profileResult = await db.query(`
            INSERT INTO profiles (user_id, full_name, phone, branch, year_of_study, resume_url) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [
            student.id,
            data.name,
            data.phone,
            data.branch,
            data.year,
            `https://resume-storage.com/${data.name.toLowerCase().replace(' ', '-')}.pdf`
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

    // Find john.doe@student.edu student
    const johnDoe = students.find(student => student.email === 'john.doe@student.edu');
    if (!johnDoe) {
        console.log('⚠️ john.doe@student.edu not found, skipping applications');
        return applications;
    }

    // Find specific jobs for john.doe's applications
    const targetJobs = [
        jobs.find(job => job.title === 'Software Engineer Intern'),
        jobs.find(job => job.title === 'Full Stack Developer'),
        jobs.find(job => job.title === 'Data Scientist'),
        jobs.find(job => job.title === 'Frontend Developer')
    ];

    if (targetJobs.some(job => !job)) {
        console.log('⚠️ Required jobs not found, skipping applications');
        return applications;
    }

    // Create exactly 4 applications for john.doe@student.edu with simplified status progression
    const applicationsData = [
        {
            student_id: johnDoe.id,
            job_id: targetJobs[0].id, // Software Engineer Intern
            status: 'applied' // Just applied, no further progress
        },
        {
            student_id: johnDoe.id,
            job_id: targetJobs[1].id, // Full Stack Developer
            status: 'applied' // Applied, interview scheduled
        },
        {
            student_id: johnDoe.id,
            job_id: targetJobs[2].id, // Data Scientist
            status: 'shortlisted' // Shortlisted, interview scheduled
        },
        {
            student_id: johnDoe.id,
            job_id: targetJobs[3].id, // Frontend Developer
            status: 'placed' // Final status - successfully placed
        }
    ];

    for (const appData of applicationsData) {
        const result = await db.query(`
            INSERT INTO applications (student_id, job_id, status) 
            VALUES ($1, $2, $3) RETURNING *
        `, [appData.student_id, appData.job_id, appData.status]);
        applications.push(result.rows[0]);
    }

    console.log(`✅ Created ${applications.length} applications for john.doe@student.edu`);
    console.log(`🎯 ${jobs.length - 4} jobs remain available for manual testing`);
    return applications;
}

async function seedInterviews(applications, companies) {
    console.log('🎤 Seeding interviews...');

    const interviews = [];
    const modes = ['online', 'offline'];

    // Find john.doe@student.edu applications
    const johnDoeApps = applications.filter(app => {
        // Get the student email to verify it's john.doe
        return true; // We'll filter by checking the student_id matches john.doe later
    });

    // Create interviews for 3 out of 4 john.doe applications
    // Skip the first application (Software Engineer Intern) - no interview
    const appsForInterviews = johnDoeApps.slice(1, 4); // Take applications 2, 3, 4

    const interviewsData = [
        {
            app: appsForInterviews[0], // Full Stack Developer (reviewed)
            scheduled_at: getFutureDate(5), // 5 days from now
            mode: 'online',
            status: 'scheduled',
            feedback: null
        },
        {
            app: appsForInterviews[1], // Data Scientist (round1_qualified)
            scheduled_at: getFutureDate(8), // 8 days from now
            mode: 'offline',
            status: 'scheduled',
            feedback: null
        },
        {
            app: appsForInterviews[2], // Frontend Developer (placed)
            scheduled_at: getFutureDate(1), // 1 day from now (but mark as completed)
            mode: 'online',
            status: 'completed',
            feedback: 'Excellent technical skills and problem-solving approach. Strong candidate for the role. Recommended for placement.'
        }
    ];

    for (const interviewData of interviewsData) {
        const app = interviewData.app;

        // Get job info to find company
        const jobResult = await db.query(
            'SELECT company_id FROM jobs WHERE id = $1',
            [app.job_id]
        );

        if (jobResult.rows.length === 0) {
            continue;
        }

        const companyId = jobResult.rows[0].company_id;

        const result = await db.query(`
            INSERT INTO interviews (application_id, student_id, company_id, scheduled_at, mode, status, feedback) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [
            app.id,
            app.student_id,
            companyId,
            interviewData.scheduled_at,
            interviewData.mode,
            interviewData.status,
            interviewData.feedback
        ]);
        interviews.push(result.rows[0]);
    }

    console.log(`✅ Created ${interviews.length} interviews for john.doe@student.edu`);
    return interviews;
}

async function seedPlacements(applications, jobs) {
    console.log('🎯 Seeding placements...');

    const placements = [];

    // Create 1 placement for john.doe@student.edu from the Frontend Developer job
    // This will be the job where the interview was completed successfully
    const frontendDevApp = applications.find(app => {
        // Find the application for Frontend Developer job
        const job = jobs.find(j => j.id === app.job_id && j.title === 'Frontend Developer');
        return job && app.status === 'placed';
    });

    if (frontendDevApp) {
        // Get job and company info
        const jobResult = await db.query(
            'SELECT id, company_id, title, package FROM jobs WHERE id = $1',
            [frontendDevApp.job_id]
        );

        if (jobResult.rows.length > 0) {
            const job = jobResult.rows[0];

            // Create placement with job's original package for consistency
            const result = await db.query(`
                INSERT INTO placements (student_id, job_id, company_id, package, role, status) 
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [
                frontendDevApp.student_id,
                job.id,
                job.company_id,
                job.package, // Use job's original package (₹15,00,000 LPA)
                job.title,
                'accepted' // Placement has been accepted
            ]);
            placements.push(result.rows[0]);
        }
    }

    console.log(`✅ Created ${placements.length} placement for john.doe@student.edu`);
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
