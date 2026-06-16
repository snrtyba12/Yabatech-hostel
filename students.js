const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { run, get, all } = require('../database/db');
const { generateToken, authenticateStudent } = require('../middleware/auth');
const { validateStudentRegister, validateStudentLogin } = require('../middleware/validation');

router.post('/register', validateStudentRegister, async (req, res) => {
  try {
    const { matric_number, first_name, last_name, email, phone, department, level, password, gender, date_of_birth, address, guardian_name, guardian_phone } = req.body;
    const existing = await get('SELECT id FROM students WHERE matric_number = ? OR email = ?', [matric_number, email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Student with this matric number or email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO students (matric_number, first_name, last_name, email, phone, department, level, password_hash, gender, date_of_birth, address, guardian_name, guardian_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [matric_number, first_name, last_name, email, phone || null, department, level, passwordHash, gender, date_of_birth || null, address || null, guardian_name || null, guardian_phone || null]
    );
    const token = generateToken({ id: result.id, matric_number, email, userType: 'student' });
    res.status(201).json({ success: true, message: 'Registration successful', data: { id: result.id, matric_number, first_name, last_name, email, token } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
});

router.post('/login', validateStudentLogin, async (req, res) => {
  try {
    const { matric_number, password } = req.body;
    const student = await get('SELECT id, matric_number, first_name, last_name, email, password_hash FROM students WHERE matric_number = ?', [matric_number]);
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid matric number or password' });
    }
    const validPassword = await bcrypt.compare(password, student.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid matric number or password' });
    }
    const token = generateToken({ id: student.id, matric_number: student.matric_number, email: student.email, userType: 'student' });
    res.json({ success: true, message: 'Login successful', data: { id: student.id, matric_number: student.matric_number, first_name: student.first_name, last_name: student.last_name, email: student.email, token } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
});

router.get('/profile', authenticateStudent, async (req, res) => {
  try {
    const student = await get(`SELECT id, matric_number, first_name, last_name, email, phone, department, level, gender, date_of_birth, address, guardian_name, guardian_phone, profile_image, created_at FROM students WHERE id = ?`, [req.studentId]);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    const applications = await all(`SELECT a.id, a.status, a.payment_status, a.application_date, rt.name as room_type, r.room_number FROM applications a LEFT JOIN room_types rt ON a.room_type_id = rt.id LEFT JOIN allocations al ON al.application_id = a.id LEFT JOIN rooms r ON al.room_id = r.id WHERE a.student_id = ? ORDER BY a.application_date DESC`, [req.studentId]);
    const complaints = await all(`SELECT id, category, title, status, priority, created_at FROM complaints WHERE student_id = ? ORDER BY created_at DESC`, [req.studentId]);
    const notifications = await all(`SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? AND user_type = 'student' ORDER BY created_at DESC LIMIT 10`, [req.studentId]);
    res.json({ success: true, data: { profile: student, applications, complaints, notifications } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load profile', error: err.message });
  }
});

router.put('/profile', authenticateStudent, async (req, res) => {
  try {
    const { phone, address, guardian_name, guardian_phone } = req.body;
    await run(`UPDATE students SET phone = ?, address = ?, guardian_name = ?, guardian_phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [phone || null, address || null, guardian_name || null, guardian_phone || null, req.studentId]);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
  }
});

router.put('/change-password', authenticateStudent, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Current password and new password (min 6 chars) are required' });
    }
    const student = await get('SELECT password_hash FROM students WHERE id = ?', [req.studentId]);
    const valid = await bcrypt.compare(current_password, student.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    const newHash = await bcrypt.hash(new_password, 10);
    await run('UPDATE students SET password_hash = ? WHERE id = ?', [newHash, req.studentId]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password', error: err.message });
  }
});

router.get('/room-types', async (req, res) => {
  try {
    const roomTypes = await all('SELECT * FROM room_types ORDER BY price_per_semester');
    res.json({ success: true, data: roomTypes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load room types', error: err.message });
  }
});

router.post('/apply', authenticateStudent, async (req, res) => {
  try {
    const { room_type_id, preferred_block } = req.body;
    const existing = await get("SELECT id, status FROM applications WHERE student_id = ? AND status IN ('pending', 'approved')", [req.studentId]);
    if (existing) {
      return res.status(409).json({ success: false, message: `You already have an application with status: ${existing.status}` });
    }
    const roomType = await get('SELECT available_count FROM room_types WHERE id = ?', [room_type_id]);
    if (!roomType) return res.status(404).json({ success: false, message: 'Room type not found' });
    if (roomType.available_count <= 0) {
      return res.status(400).json({ success: false, message: 'No rooms available for this type' });
    }
    const result = await run('INSERT INTO applications (student_id, room_type_id, preferred_block) VALUES (?, ?, ?)', [req.studentId, room_type_id, preferred_block || null]);
    await run(`INSERT INTO notifications (user_id, user_type, title, message, type) VALUES (?, 'student', 'Application Submitted', 'Your room application has been submitted and is pending review.', 'info')`, [req.studentId]);
    res.status(201).json({ success: true, message: 'Application submitted successfully', data: { application_id: result.id } });
  } catch (err) {
    console.error('Application error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit application', error: err.message });
  }
});

router.get('/my-applications', authenticateStudent, async (req, res) => {
  try {
    const applications = await all(`SELECT a.*, rt.name as room_type, rt.price_per_semester FROM applications a JOIN room_types rt ON a.room_type_id = rt.id WHERE a.student_id = ? ORDER BY a.application_date DESC`, [req.studentId]);
    res.json({ success: true, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load applications', error: err.message });
  }
});

router.post('/complaint', authenticateStudent, async (req, res) => {
  try {
    const { category, title, description, room_number } = req.body;
    const result = await run('INSERT INTO complaints (student_id, category, title, description, room_number) VALUES (?, ?, ?, ?, ?)', [req.studentId, category, title, description, room_number || null]);
    res.status(201).json({ success: true, message: 'Complaint submitted successfully', data: { complaint_id: result.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit complaint', error: err.message });
  }
});

router.get('/my-complaints', authenticateStudent, async (req, res) => {
  try {
    const complaints = await all(`SELECT id, category, title, status, priority, room_number, created_at, resolved_at FROM complaints WHERE student_id = ? ORDER BY created_at DESC`, [req.studentId]);
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load complaints', error: err.message });
  }
});

router.put('/notifications/:id/read', authenticateStudent, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND user_type = "student"', [req.params.id, req.studentId]);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification', error: err.message });
  }
});

module.exports = router;
