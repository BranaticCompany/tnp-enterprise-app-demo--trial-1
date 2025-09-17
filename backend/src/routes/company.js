const express = require('express');
const companyController = require('../controllers/companyController');
const { authenticateToken, requireRole } = require('../utils/authMiddleware');

const router = express.Router();

// Apply JWT authentication middleware to all company routes
router.use(authenticateToken);

// Public endpoints (all authenticated users can read)
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);

// Protected endpoints (Recruiter/Admin only)
router.post('/', requireRole(['recruiter', 'admin']), companyController.createCompany);
router.put('/:id', requireRole(['recruiter', 'admin']), companyController.updateCompany);
router.delete('/:id', requireRole(['recruiter', 'admin']), companyController.deleteCompany);

module.exports = router;
