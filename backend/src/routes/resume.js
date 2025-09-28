const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../utils/authMiddleware');
const { upload, handleUploadError } = require('../middleware/upload');
const { uploadResume, deleteResume, getResume, getResumeInfo } = require('../controllers/resumeController');

// All routes require authentication
router.use(authenticateToken);
// POST /api/v1/students/:id/resume - Upload resume
// Students can upload their own resume, admins can upload for any student
router.post('/:id/resume', 
    requireRole(['student', 'admin']),
    upload,
    handleUploadError,
    uploadResume
);

// DELETE /api/v1/students/:id/resume - Delete resume
// Students can delete their own resume, admins can delete any resume
router.delete('/:id/resume',
    requireRole(['student', 'admin']),
    deleteResume
);

// GET /api/v1/students/:id/resume - Download/view resume
// All authenticated users can view resumes (for recruiter/admin access)
router.get('/:id/resume',
    getResume
);

// GET /api/v1/students/:id/resume/info - Get resume metadata
// All authenticated users can get resume info
router.get('/:id/resume/info',
    getResumeInfo
);

module.exports = router;
