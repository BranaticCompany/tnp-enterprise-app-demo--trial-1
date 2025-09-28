const express = require('express')
const router = express.Router()
const { getAllUsers, getAllCompanies, getAllStudents } = require('../controllers/adminController')
const { 
  getSummaryStats, 
  getApplicationsByCompany, 
  getPackageDistribution,
  getPlacementTrends,
  getApplicationStatus 
} = require('../controllers/reportsController')
const { authenticateToken, requireRole } = require('../utils/authMiddleware')

// Apply JWT authentication middleware to all admin routes
router.use(authenticateToken)

// Admin routes - all require admin role
router.get('/users', requireRole(['admin']), getAllUsers)
router.get('/companies', requireRole(['admin']), getAllCompanies)
router.get('/students', requireRole(['admin']), getAllStudents)

// Reports routes - all require admin role
router.get('/reports/summary', requireRole(['admin']), getSummaryStats)
router.get('/reports/applications-by-company', requireRole(['admin']), getApplicationsByCompany)
router.get('/reports/package-distribution', requireRole(['admin']), getPackageDistribution)
router.get('/reports/placement-trends', requireRole(['admin']), getPlacementTrends)
router.get('/reports/application-status', requireRole(['admin']), getApplicationStatus)

module.exports = router
