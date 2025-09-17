const express = require('express');
const applicationController = require('../controllers/applicationController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

const router = express.Router();

// Apply JWT authentication middleware to all application routes
router.use(authenticateToken);

// Student endpoints
router.post('/', requireRole(['student']), applicationController.applyForJob);
router.get('/me', requireRole(['student']), applicationController.getMyApplications);

// Recruiter endpoints
router.get('/job/:jobId', requireRole(['recruiter', 'admin']), applicationController.getJobApplications);

// Admin endpoints
router.get('/', requireRole(['admin']), applicationController.getAllApplications);

// Recruiter/Admin endpoints for status updates
router.put('/:id/status', requireRole(['recruiter', 'admin']), applicationController.updateApplicationStatus);

module.exports = router;
