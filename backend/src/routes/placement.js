const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../utils/authMiddleware');
const {
    createPlacement,
    getPlacements,
    getPlacementById,
    updatePlacement,
    deletePlacement
} = require('../controllers/placementController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/v1/placements - List placements (role-based filtering)
// Students: only their own placements
// Recruiters: all placements (can be filtered by company)
// Admins: all placements
router.get('/', getPlacements);

// GET /api/v1/placements/:id - Get placement by ID
// Students: only their own placements
// Recruiters & Admins: any placement
router.get('/:id', getPlacementById);

// POST /api/v1/placements - Create placement (Admin only)
router.post('/', requireRole(['admin']), createPlacement);

// PUT /api/v1/placements/:id - Update placement (Admin only)
router.put('/:id', requireRole(['admin']), updatePlacement);

// DELETE /api/v1/placements/:id - Delete placement (Admin only)
router.delete('/:id', requireRole(['admin']), deletePlacement);

module.exports = router;
