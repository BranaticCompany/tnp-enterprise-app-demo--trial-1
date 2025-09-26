const express = require('express');
const recruiterController = require('../controllers/recruiterController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

const router = express.Router();

// Apply JWT authentication middleware to all recruiter routes
router.use(authenticateToken);

// Recruiter dashboard endpoint
router.get('/dashboard', requireRole(['recruiter', 'admin']), recruiterController.getDashboard);

module.exports = router;
