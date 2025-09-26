const express = require('express')
const router = express.Router()
const { getAllUsers, getAllCompanies, getAllStudents } = require('../controllers/adminController')
const { authenticateToken, requireRole } = require('../utils/authMiddleware')

// Apply JWT authentication middleware to all admin routes
router.use(authenticateToken)

// Admin routes - all require admin role
router.get('/users', requireRole(['admin']), getAllUsers)
router.get('/companies', requireRole(['admin']), getAllCompanies)
router.get('/students', requireRole(['admin']), getAllStudents)

module.exports = router
