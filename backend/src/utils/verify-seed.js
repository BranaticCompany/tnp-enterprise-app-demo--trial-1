require('dotenv').config();
const db = require('./database');

async function verifySeedData() {
    try {
        console.log('🔍 Verifying seed data...\n');
        
        // Check jobs count and details
        const jobsResult = await db.query(`
            SELECT j.id, j.title, j.package, j.type, c.name as company_name
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            ORDER BY j.title
        `);
        
        console.log(`📊 Jobs in database: ${jobsResult.rows.length}`);
        console.log('Jobs details:');
        jobsResult.rows.forEach((job, index) => {
            const packageDisplay = job.package ? `₹${(job.package / 100000).toFixed(1)}LPA` : 'Not specified';
            if (job.type === 'Internship' && job.package) {
                const monthlyStipend = `₹${job.package.toLocaleString()}/month`;
                console.log(`  ${index + 1}. ${job.title} - ${job.company_name} - ${monthlyStipend} (${job.type})`);
            } else {
                console.log(`  ${index + 1}. ${job.title} - ${job.company_name} - ${packageDisplay} (${job.type})`);
            }
        });
        
        // Check applications count and details
        const applicationsResult = await db.query(`
            SELECT a.id, a.status, j.title as job_title, u.email as student_email
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.student_id = u.id
            ORDER BY j.title
        `);
        
        console.log(`\n📝 Applications in database: ${applicationsResult.rows.length}`);
        console.log('Applications details:');
        applicationsResult.rows.forEach((app, index) => {
            console.log(`  ${index + 1}. ${app.student_email} applied to "${app.job_title}" - Status: ${app.status}`);
        });
        
        // Check unapplied jobs
        const unappliedJobsResult = await db.query(`
            SELECT j.title, c.name as company_name
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            WHERE j.id NOT IN (SELECT DISTINCT job_id FROM applications)
            ORDER BY j.title
        `);
        
        console.log(`\n🎯 Unapplied jobs: ${unappliedJobsResult.rows.length}`);
        console.log('Available for manual testing:');
        unappliedJobsResult.rows.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} - ${job.company_name}`);
        });
        
        // Summary
        console.log('\n✅ Verification Summary:');
        console.log(`   • Total jobs: ${jobsResult.rows.length}`);
        console.log(`   • Applied jobs: ${applicationsResult.rows.length}`);
        console.log(`   • Available jobs: ${unappliedJobsResult.rows.length}`);
        
        if (jobsResult.rows.length === 10 && applicationsResult.rows.length === 2 && unappliedJobsResult.rows.length === 8) {
            console.log('🎉 Perfect! Seeding worked as expected.');
        } else {
            console.log('⚠️  Numbers don\'t match expected values (10 jobs, 2 applications, 8 unapplied)');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        process.exit(0);
    }
}

// Run verification
if (require.main === module) {
    verifySeedData();
}

module.exports = { verifySeedData };
