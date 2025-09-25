const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../utils/authMiddleware');
const {
    createInterview,
    getInterviews,
    getInterviewById,
    updateInterview,
    deleteInterview,
    getMyInterviews
} = require('../controllers/interviewController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/v1/interviews/me - Get student's own interviews
router.get('/me', requireRole(['student']), getMyInterviews);

// GET /api/v1/interviews - List interviews (role-based filtering)
// Students: only their own interviews
// Recruiters: interviews for their company's jobs
// Admins: all interviews
router.get('/', getInterviews);

// GET /api/v1/interviews/:id - Get interview by ID
// Students: only their own interviews
// Recruiters & Admins: any interview
router.get('/:id', getInterviewById);

// POST /api/v1/interviews - Create interview (Admin/Recruiter only)
router.post('/', requireRole(['admin', 'recruiter']), createInterview);

// PUT /api/v1/interviews/:id - Update interview (Admin/Recruiter only)
router.put('/:id', requireRole(['admin', 'recruiter']), updateInterview);

// DELETE /api/v1/interviews/:id - Delete interview (Admin only)
router.delete('/:id', requireRole(['admin']), deleteInterview);

module.exports = router;
