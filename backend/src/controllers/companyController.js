const db = require('../utils/database');

// Validation helper function
const validateCompanyData = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Company name is required');
  }

  if (data.name && data.name.trim().length > 255) {
    errors.push('Company name must be less than 255 characters');
  }

  if (data.website && !/^https?:\/\/.+/.test(data.website)) {
    errors.push('Website must be a valid URL starting with http:// or https://');
  }

  if (data.website && data.website.length > 500) {
    errors.push('Website URL must be less than 500 characters');
  }

  return errors;
};

// GET /api/v1/companies - Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await db.query('SELECT * FROM companies ORDER BY created_at DESC');
    
    console.log('Companies query result:', companies.rows);
    const response = {
      companies: companies.rows,
      count: companies.rows.length,
    };
    console.log('Sending companies response:', response);
    
    res.status(200).json(response);

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/v1/companies/:id - Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT id, name, description, website, created_at, updated_at FROM companies WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.status(200).json({
      company: result.rows[0]
    });

  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/v1/companies - Create new company (Recruiter/Admin only)
const createCompany = async (req, res) => {
  try {
    const { name, description, website } = req.body;

    // Validate input data
    const validationErrors = validateCompanyData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check if company with same name already exists
    const existingCompany = await db.query(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingCompany.rows.length > 0) {
      return res.status(409).json({ error: 'Company with this name already exists' });
    }

    // Create new company
    const result = await db.query(
      'INSERT INTO companies (name, description, website) VALUES ($1, $2, $3) RETURNING id, name, description, website, created_at, updated_at',
      [name.trim(), description || null, website || null]
    );

    res.status(201).json({
      message: 'Company created successfully',
      company: result.rows[0]
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/v1/companies/:id - Update company (Recruiter/Admin only)
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, website } = req.body;

    // Validate input data
    const validationErrors = validateCompanyData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Check if company exists
    const existingCompany = await db.query(
      'SELECT id FROM companies WHERE id = $1',
      [id]
    );

    if (existingCompany.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get current company data to check if name is actually changing
    const currentCompany = await db.query(
      'SELECT name FROM companies WHERE id = $1',
      [id]
    );

    // Only check for duplicates if the name is actually changing
    if (currentCompany.rows[0].name.toLowerCase() !== name.trim().toLowerCase()) {
      const duplicateCompany = await db.query(
        'SELECT id FROM companies WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name.trim(), id]
      );

      if (duplicateCompany.rows.length > 0) {
        return res.status(409).json({ error: 'Company with this name already exists' });
      }
    }

    // Update company
    const result = await db.query(
      'UPDATE companies SET name = $2, description = $3, website = $4, updated_at = NOW() WHERE id = $1 RETURNING id, name, description, website, created_at, updated_at',
      [id, name.trim(), description || null, website || null]
    );

    res.status(200).json({
      message: 'Company updated successfully',
      company: result.rows[0]
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/v1/companies/:id - Delete company (Recruiter/Admin only)
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if company exists
    const existingCompany = await db.query(
      'SELECT id, name FROM companies WHERE id = $1',
      [id]
    );

    if (existingCompany.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Delete company (CASCADE will handle related jobs)
    await db.query('DELETE FROM companies WHERE id = $1', [id]);

    res.status(200).json({
      message: 'Company deleted successfully',
      deletedCompany: {
        id: existingCompany.rows[0].id,
        name: existingCompany.rows[0].name
      }
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
};
