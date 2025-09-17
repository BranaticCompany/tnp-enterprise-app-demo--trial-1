const express = require('express');
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../utils/authMiddleware');

const router = express.Router();

// Apply JWT authentication middleware to all profile routes
router.use(authenticateToken);

// Health check for profile routes
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Profile routes are working',
    user: req.user,
    endpoints: [
      'GET /me',
      'POST /', 
      'PUT /'
    ]
  });
});

// Profile endpoints
router.get('/me', profileController.getMyProfile);
router.post('/', profileController.createProfile);
router.put('/', profileController.updateProfile);

module.exports = router;
