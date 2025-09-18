const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../utils/authMiddleware');
const {
    getApplicationsReport,
    getInterviewsReport,
    getPlacementsReport,
    getStudentsReport,
    getMyReport
} = require('../controllers/reportController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/v1/reports/applications - Applications by Job/Company (Admin/Recruiter only)
router.get('/applications', requireRole(['admin', 'recruiter']), getApplicationsReport);

// GET /api/v1/reports/interviews - Interview Statistics (Admin/Recruiter only)
router.get('/interviews', requireRole(['admin', 'recruiter']), getInterviewsReport);

// GET /api/v1/reports/placements - Placement Statistics (Admin/Recruiter only)
router.get('/placements', requireRole(['admin', 'recruiter']), getPlacementsReport);

// GET /api/v1/reports/students - Student Activity Overview (Admin/Recruiter only)
router.get('/students', requireRole(['admin', 'recruiter']), getStudentsReport);

// GET /api/v1/reports/me - Student's own summary (Student only)
router.get('/me', getMyReport);

module.exports = router;
