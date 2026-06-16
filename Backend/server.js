const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend files from PARENT directory (one level up from backend/)
app.use(express.static(path.join(__dirname, '..')));

// Import routes
const studentRoutes = require('./routes/students');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/admin', authLimiter, adminRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Yabatech Hostel API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve frontend pages for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════');
  console.log('  YABATECH HOSTEL API SERVER');
  console.log('═══════════════════════════════════════');
  console.log(`  Server running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  API Base: http://localhost:${PORT}/api`);
  console.log('═══════════════════════════════════════');
  console.log('  Endpoints:');
  console.log('  • POST /api/students/register');
  console.log('  • POST /api/students/login');
  console.log('  • GET  /api/students/profile');
  console.log('  • POST /api/students/apply');
  console.log('  • POST /api/admin/login');
  console.log('  • GET  /api/admin/dashboard');
  console.log('  • POST /api/public/contact');
  console.log('  • GET  /api/public/room-types');
  console.log('═══════════════════════════════════════');
});
