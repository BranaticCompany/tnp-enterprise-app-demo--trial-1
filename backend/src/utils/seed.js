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
const generatePackage = () => Math.floor(Math.random() * 1000000 + 300000); // 3 LPA to 13 LPA

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
    
    // Job data with varying deadlines
    const jobData = [
        {
            title: 'Software Engineer Intern',
            description: 'Join our dynamic team as a software engineering intern. Work on real-world projects using modern technologies.',
            eligibility: 'Computer Science/IT students with good programming skills',
            deadline: getFutureDate(15) // 15 days from now
        },
        {
            title: 'Full Stack Developer',
            description: 'Develop end-to-end web applications using React, Node.js, and modern databases.',
            eligibility: 'Final year students with web development experience',
            deadline: getFutureDate(30) // 30 days from now
        },
        {
            title: 'Data Scientist',
            description: 'Analyze large datasets and build machine learning models to drive business insights.',
            eligibility: 'Students with strong mathematics and Python programming skills',
            deadline: getFutureDate(45) // 45 days from now
        },
        {
            title: 'Frontend Developer',
            description: 'Create beautiful and responsive user interfaces using React, Angular, or Vue.js.',
            eligibility: 'Students with frontend development skills and design sense',
            deadline: getFutureDate(7) // 7 days from now (urgent)
        },
        {
            title: 'DevOps Engineer',
            description: 'Manage cloud infrastructure and implement CI/CD pipelines for scalable applications.',
            eligibility: 'Students familiar with cloud platforms and automation tools',
            deadline: getFutureDate(60) // 60 days from now
        }
    ];
    
    for (let i = 0; i < jobData.length; i++) {
        const job = jobData[i];
        const company = companyRecords[i % companyRecords.length]; // Distribute jobs across companies
        
        const result = await db.query(`
            INSERT INTO jobs (company_id, title, description, eligibility, application_deadline) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [company.id, job.title, job.description, job.eligibility, job.deadline]);
        jobs.push(result.rows[0]);
    }
    
    console.log(`✅ Created ${jobs.length} jobs`);
    return jobs;
}

async function seedApplications(students, jobs) {
    console.log('📝 Seeding applications...');
    
    const applications = [];
    const statuses = ['applied', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    
    // Create 18-22 applications with realistic distribution
    const applicationCount = 20;
    
    for (let i = 0; i < applicationCount; i++) {
        const student = getRandomElement(students);
        const job = getRandomElement(jobs);
        
        // Check if this student already applied to this job
        const existingApp = await db.query(
            'SELECT id FROM applications WHERE student_id = $1 AND job_id = $2',
            [student.id, job.id]
        );
        
        if (existingApp.rows.length > 0) {
            continue; // Skip duplicate applications
        }
        
        // Weight the status distribution realistically
        let status;
        const rand = Math.random();
        if (rand < 0.35) status = 'applied';
        else if (rand < 0.55) status = 'reviewed';
        else if (rand < 0.75) status = 'shortlisted';
        else if (rand < 0.85) status = 'rejected';
        else status = 'hired';
        
        const result = await db.query(`
            INSERT INTO applications (student_id, job_id, status) 
            VALUES ($1, $2, $3) RETURNING *
        `, [student.id, job.id, status]);
        applications.push(result.rows[0]);
    }
    
    console.log(`✅ Created ${applications.length} applications`);
    return applications;
}

async function seedInterviews(applications, companies) {
    console.log('🎤 Seeding interviews...');
    
    const interviews = [];
    const modes = ['online', 'offline'];
    const statuses = ['scheduled', 'completed', 'cancelled'];
    
    // Create interviews for shortlisted and hired applications
    const eligibleApps = applications.filter(app => 
        app.status === 'shortlisted' || app.status === 'hired'
    );
    
    // Create 6-8 interviews
    const interviewCount = Math.min(8, eligibleApps.length);
    const selectedApps = getRandomElements(eligibleApps, interviewCount);
    
    for (const app of selectedApps) {
        // Get student info for the application
        const studentResult = await db.query(
            'SELECT id FROM users WHERE id = $1',
            [app.student_id]
        );
        
        // Get job info to find company
        const jobResult = await db.query(
            'SELECT company_id FROM jobs WHERE id = $1',
            [app.job_id]
        );
        
        if (studentResult.rows.length === 0 || jobResult.rows.length === 0) {
            continue;
        }
        
        const student = studentResult.rows[0];
        const companyId = jobResult.rows[0].company_id;
        
        const mode = getRandomElement(modes);
        let status, scheduledAt, feedback = null;
        
        // Determine status and schedule based on application status
        // Note: All scheduled_at must be future dates due to DB constraint
        if (app.status === 'hired') {
            status = 'completed';
            scheduledAt = getFutureDate(Math.floor(Math.random() * 3) + 1); // 1-3 days from now (will be marked completed)
            feedback = 'Excellent performance. Strong technical skills and good communication.';
        } else {
            const rand = Math.random();
            if (rand < 0.6) {
                status = 'scheduled';
                scheduledAt = getFutureDate(Math.floor(Math.random() * 14) + 1); // 1-14 days from now
            } else if (rand < 0.8) {
                status = 'completed';
                scheduledAt = getFutureDate(Math.floor(Math.random() * 5) + 1); // 1-5 days from now (will be marked completed)
                feedback = 'Good technical knowledge. Needs improvement in problem-solving approach.';
            } else {
                status = 'cancelled';
                scheduledAt = getFutureDate(Math.floor(Math.random() * 7) + 1); // Future date even if cancelled
            }
        }
        
        const result = await db.query(`
            INSERT INTO interviews (application_id, student_id, company_id, scheduled_at, mode, status, feedback) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `, [app.id, student.id, companyId, scheduledAt, mode, status, feedback]);
        interviews.push(result.rows[0]);
    }
    
    console.log(`✅ Created ${interviews.length} interviews`);
    return interviews;
}

async function seedPlacements(applications, jobs) {
    console.log('🎯 Seeding placements...');
    
    const placements = [];
    const statuses = ['offered', 'accepted', 'joined', 'declined'];
    
    // Create placements for hired applications
    const hiredApps = applications.filter(app => app.status === 'hired');
    
    // Create 2-3 placements
    const placementCount = Math.min(3, hiredApps.length);
    const selectedApps = getRandomElements(hiredApps, placementCount);
    
    for (const app of selectedApps) {
        // Get job and company info
        const jobResult = await db.query(
            'SELECT id, company_id, title FROM jobs WHERE id = $1',
            [app.job_id]
        );
        
        if (jobResult.rows.length === 0) continue;
        
        const job = jobResult.rows[0];
        const packageAmount = generatePackage();
        
        // Determine placement status
        let status;
        const rand = Math.random();
        if (rand < 0.4) status = 'offered';
        else if (rand < 0.7) status = 'accepted';
        else if (rand < 0.9) status = 'joined';
        else status = 'declined';
        
        const result = await db.query(`
            INSERT INTO placements (student_id, job_id, company_id, package, role, status) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [app.student_id, job.id, job.company_id, packageAmount, job.title, status]);
        placements.push(result.rows[0]);
    }
    
    console.log(`✅ Created ${placements.length} placements`);
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
