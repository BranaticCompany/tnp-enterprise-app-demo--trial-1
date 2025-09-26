require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profile');
const companyRoutes = require('./src/routes/company');
const jobRoutes = require('./src/routes/job');
const applicationRoutes = require('./src/routes/application');
const placementRoutes = require('./src/routes/placement');
const interviewRoutes = require('./src/routes/interview');
const reportRoutes = require('./src/routes/report');
const recruiterRoutes = require('./src/routes/recruiter');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
app.use(cors({
  origin: "http://localhost:3000",   // Allow frontend dev server
  credentials: true,                 // Allow cookies/auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle preflight requests
app.options("*", cors());

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/placements', placementRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/recruiter', recruiterRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

let server;

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };
