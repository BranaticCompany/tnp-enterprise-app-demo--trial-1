const express = require('express');
const jobController = require('../controllers/jobController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

const router = express.Router();

// Apply JWT authentication middleware to all job routes
router.use(authenticateToken);

// Public endpoints (all authenticated users can read)
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);

// Protected endpoints (Recruiter/Admin only)
router.post('/', requireRole(['recruiter', 'admin']), jobController.createJob);
router.put('/:id', requireRole(['recruiter', 'admin']), jobController.updateJob);
router.delete('/:id', requireRole(['recruiter', 'admin']), jobController.deleteJob);

module.exports = router;
