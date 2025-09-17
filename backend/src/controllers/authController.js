const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-here';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// In-memory OTP store for demo purposes
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate secure refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Signup endpoint
const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in memory (expires in 5 minutes)
    otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

    // Insert user into database
    await db.query(
      'INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, $2, $3, $4)',
      [email, passwordHash, 'user', false]
    );

    res.status(200).json({ 
      message: 'User created successfully', 
      otp_sent: true,
      // For demo purposes, return the OTP (in production, this would be sent via email)
      otp: otp
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify OTP endpoint
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Check OTP from store
    const storedOTP = otpStore.get(email);
    if (!storedOTP) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    if (Date.now() > storedOTP.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark user as verified
    await db.query('UPDATE users SET is_verified = true WHERE email = $1', [email]);

    // Remove OTP from store
    otpStore.delete(email);

    res.status(200).json({ verified: true, message: 'Account verified successfully' });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login endpoint
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const userResult = await db.query(
      'SELECT id, email, password_hash, role, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(403).json({ error: 'verify_account', message: 'Please verify your account first' });
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password_hash, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { sub: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await argon2.hash(refreshToken);

    // Store refresh token in database
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] // 7 days
    );

    res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Refresh token endpoint
const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Get all refresh tokens and check against the provided one
    const tokenResults = await db.query(
      'SELECT rt.id, rt.user_id, rt.token_hash, rt.expires_at, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.expires_at > NOW()'
    );

    let validToken = null;
    let tokenId = null;

    for (const tokenRow of tokenResults.rows) {
      try {
        const isValid = await argon2.verify(tokenRow.token_hash, refresh_token);
        if (isValid) {
          validToken = tokenRow;
          tokenId = tokenRow.id;
          break;
        }
      } catch (err) {
        // Continue checking other tokens
        continue;
      }
    }

    if (!validToken) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { sub: validToken.user_id, role: validToken.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Generate new refresh token (token rotation)
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = await argon2.hash(newRefreshToken);

    // Update refresh token in database
    await db.query(
      'UPDATE refresh_tokens SET token_hash = $1, expires_at = $2 WHERE id = $3',
      [newRefreshTokenHash, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), tokenId]
    );

    res.status(200).json({
      access_token: accessToken,
      refresh_token: newRefreshToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  signup,
  verifyOTP,
  login,
  refresh
};
