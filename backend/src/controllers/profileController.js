const db = require('../utils/database');

// Validation helper function

const validateProfileData = (data) => {
  const errors = [];

  // Phone validation - accept optional + sign at start
  if (data.phone && !/^\+?\d{10,15}$/.test(data.phone)) {
    errors.push('Invalid phone number format');
  }

  // Year of study validation - always check if provided
  if (data.year_of_study !== undefined && (data.year_of_study < 1 || data.year_of_study > 5)) {
    errors.push('Year of study must be between 1 and 5');
  }

  // CGPA validation - check if provided and within valid range
  if (data.cgpa !== undefined && data.cgpa !== null && data.cgpa !== '') {
    const cgpaValue = parseFloat(data.cgpa);
    if (isNaN(cgpaValue) || cgpaValue < 0.0 || cgpaValue > 10.0) {
      errors.push('CGPA must be between 0.0 and 10.0');
    }
  }

  // Skills validation - must be array if provided
  if (data.skills !== undefined && !Array.isArray(data.skills)) {
    errors.push('Skills must be an array');
  }

  // Validate individual skills are non-empty strings
  if (data.skills && Array.isArray(data.skills)) {
    const invalidSkills = data.skills.filter(skill => !skill || typeof skill !== 'string' || skill.trim().length === 0);
    if (invalidSkills.length > 0) {
      errors.push('All skills must be non-empty strings');
    }
  }

  if (data.full_name && data.full_name.trim().length === 0) {
    errors.push('Full name cannot be empty');
  }

  if (data.branch && data.branch.trim().length === 0) {
    errors.push('Branch cannot be empty');
  }

  return errors;
};

// GET /api/v1/profile/me - Get current user's profile
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      'SELECT id, user_id, full_name, phone, branch, year_of_study, cgpa, resume_url, skills, created_at, updated_at FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json({
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/profile - Create profile (first time)
const createProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, branch, year_of_study, cgpa, resume_url, skills } = req.body;

    // Validate input data
    const validationErrors = validateProfileData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check if profile already exists
    const existingProfile = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({ error: 'Profile already exists. Use PUT to update.' });
    }

    // Process skills array for database storage
    let skillsJson = '[]';
    if (skills && Array.isArray(skills) && skills.length > 0) {
      skillsJson = JSON.stringify(skills);
    }

    // Create new profile
    const result = await db.query(
      'INSERT INTO profiles (user_id, full_name, phone, branch, year_of_study, cgpa, resume_url, skills) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, user_id, full_name, phone, branch, year_of_study, cgpa, resume_url, skills, created_at, updated_at',
      [userId, full_name || null, phone || null, branch || null, year_of_study || null, cgpa || null, resume_url || null, skillsJson]
    );

    res.status(201).json({
      message: 'Profile created successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// PUT /api/v1/profile - Update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, branch, year_of_study, cgpa, resume_url, skills } = req.body;

    // Validate input data
    const validationErrors = validateProfileData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check if profile exists
    const existingProfile = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found. Use POST to create.' });
    }

    // Process skills array for database storage
    let skillsJson = '[]';
    if (skills && Array.isArray(skills) && skills.length > 0) {
      skillsJson = JSON.stringify(skills);
    }

    // Update profile
    const result = await db.query(
      'UPDATE profiles SET full_name = $2, phone = $3, branch = $4, year_of_study = $5, cgpa = $6, resume_url = $7, skills = $8, updated_at = NOW() WHERE user_id = $1 RETURNING id, user_id, full_name, phone, branch, year_of_study, cgpa, resume_url, skills, created_at, updated_at',
      [userId, full_name || null, phone || null, branch || null, year_of_study || null, cgpa || null, resume_url || null, skillsJson]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMyProfile,
  createProfile,
  updateProfile
};
