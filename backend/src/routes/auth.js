const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Health check for auth routes
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Auth routes are working',
    endpoints: [
      'POST /signup',
      'POST /verify-otp', 
      'POST /login',
      'POST /refresh'
    ]
  });
});

// Auth endpoints
router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOTP);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

module.exports = router;
