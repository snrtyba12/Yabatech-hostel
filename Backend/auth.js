const jwt = require('jsonwebtoken');
const { get } = require('../database/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'yabatech_hostel_secret_2026_render';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.userType !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied. Student access only.' });
    }
    const student = await get('SELECT id, matric_number, email, first_name, last_name FROM students WHERE id = ?', [decoded.id]);
    if (!student) {
      return res.status(401).json({ success: false, message: 'Student not found.' });
    }
    req.student = student;
    req.studentId = student.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.userType !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin access only.' });
    }
    const admin = await get('SELECT id, email, full_name, role FROM admins WHERE id = ?', [decoded.id]);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found.' });
    }
    req.admin = admin;
    req.adminId = admin.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.userType === 'student') {
        const student = await get('SELECT id, matric_number, email, first_name, last_name FROM students WHERE id = ?', [decoded.id]);
        if (student) {
          req.student = student;
          req.studentId = student.id;
        }
      }
    }
    next();
  } catch (err) {
    next();
  }
};

module.exports = { generateToken, authenticateStudent, authenticateAdmin, optionalAuth };
