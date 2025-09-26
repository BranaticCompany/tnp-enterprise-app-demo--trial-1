require('dotenv').config();
const db = require('./database');

// Skills mapping based on job titles
const jobSkillsMapping = {
    'Frontend Developer': ['React', 'JavaScript', 'HTML', 'CSS', 'UI/UX Design'],
    'Backend Developer': ['Node.js', 'Express', 'PostgreSQL', 'REST APIs'],
    'Full Stack Developer': ['React', 'Node.js', 'MongoDB', 'Git', 'REST APIs'],
    'Software Engineer Intern': ['JavaScript', 'Python', 'Git', 'Problem Solving'],
    'Software Development Engineer': ['Java', 'Data Structures', 'Algorithms', 'System Design'],
    'Machine Learning Engineer': ['Python', 'TensorFlow', 'Deep Learning', 'Statistics'],
    'Data Scientist': ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Statistics'],
    'Cloud Engineer Intern': ['AWS', 'Azure', 'Docker', 'Linux', 'CI/CD'],
    'Business Analyst': ['Excel', 'SQL', 'Communication', 'Requirement Analysis'],
    'Product Management Intern': ['Market Research', 'Agile', 'Wireframing', 'Communication'],
    'Quality Assurance Engineer': ['Testing', 'Selenium', 'Java', 'SDLC', 'Bug Tracking'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Linux']
};

async function addSkillsToExistingJobs() {
    try {
        console.log('🔧 Starting to add skills to existing jobs...');
        
        // Get all jobs that don't have skills (skills is null or empty)
        const jobsResult = await db.query(`
            SELECT id, title, company_name, skills 
            FROM jobs 
            WHERE skills IS NULL OR skills = '[]'::jsonb
            ORDER BY created_at ASC
        `);

        const jobs = jobsResult.rows;
        console.log(`📋 Found ${jobs.length} jobs without skills`);

        if (jobs.length === 0) {
            console.log('✅ All jobs already have skills assigned!');
            return;
        }

        let updatedCount = 0;
        let skippedCount = 0;

        for (const job of jobs) {
            const jobTitle = job.title;
            const skills = jobSkillsMapping[jobTitle];

            if (skills) {
                console.log(`\n🔄 Updating job: "${jobTitle}" (ID: ${job.id})`);
                console.log(`   Company: ${job.company_name}`);
                console.log(`   Adding skills: [${skills.join(', ')}]`);

                // Update the job with skills
                await db.query(`
                    UPDATE jobs 
                    SET skills = $1, updated_at = NOW() 
                    WHERE id = $2
                `, [JSON.stringify(skills), job.id]);

                updatedCount++;
                console.log(`   ✅ Successfully updated!`);
            } else {
                console.log(`\n⚠️  Skipping job: "${jobTitle}" (ID: ${job.id})`);
                console.log(`   Reason: No skills mapping found for this job title`);
                skippedCount++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Jobs updated: ${updatedCount}`);
        console.log(`   ⚠️  Jobs skipped: ${skippedCount}`);
        console.log(`   📋 Total jobs processed: ${jobs.length}`);

        // Verify the updates
        console.log('\n🔍 Verifying updates...');
        const verificationResult = await db.query(`
            SELECT id, title, skills, 
                   CASE 
                       WHEN skills IS NULL THEN 'NULL'
                       WHEN skills = '[]'::jsonb THEN 'EMPTY'
                       ELSE 'HAS_SKILLS'
                   END as skills_status
            FROM jobs 
            ORDER BY created_at ASC
        `);

        console.log('\n📋 Current job skills status:');
        verificationResult.rows.forEach(job => {
            const skillsCount = job.skills && Array.isArray(job.skills) ? job.skills.length : 0;
            console.log(`   ${job.title} (ID: ${job.id}) - ${job.skills_status} (${skillsCount} skills)`);
        });

        console.log('\n🎉 Skills update completed successfully!');
        
    } catch (error) {
        console.error('❌ Error adding skills to existing jobs:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        process.exit(1);
    }
}

// Run the script
async function main() {
    console.log('🚀 Add Skills to Existing Jobs Utility');
    console.log('=====================================');
    
    try {
        await addSkillsToExistingJobs();
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Script failed:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

module.exports = { addSkillsToExistingJobs, jobSkillsMapping };
