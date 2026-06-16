const express = require('express');
const router = express.Router();
const { run, get, all } = require('../database/db');
const { validateContact } = require('../middleware/validation');

router.post('/contact', validateContact, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const result = await run('INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)', [name, email, phone || null, subject, message]);
    res.status(201).json({ success: true, message: 'Thank you for contacting us! We will get back to you soon.', data: { contact_id: result.id } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send message', error: err.message });
  }
});

router.get('/room-types', async (req, res) => {
  try {
    const roomTypes = await all(`SELECT id, name, description, capacity, price_per_semester, amenities, image_url, available_count, total_count FROM room_types ORDER BY price_per_semester`);
    res.json({ success: true, data: roomTypes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load room types', error: err.message });
  }
});

router.get('/room-types/:id', async (req, res) => {
  try {
    const roomType = await get(`SELECT id, name, description, capacity, price_per_semester, amenities, image_url, available_count, total_count FROM room_types WHERE id = ?`, [req.params.id]);
    if (!roomType) return res.status(404).json({ success: false, message: 'Room type not found' });
    const rooms = await all(`SELECT id, room_number, block, floor FROM rooms WHERE room_type_id = ? AND status = 'available' ORDER BY block, room_number`, [req.params.id]);
    res.json({ success: true, data: { ...roomType, available_rooms: rooms } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load room type', error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await get(`SELECT (SELECT COUNT(*) FROM students) as total_students, (SELECT COUNT(*) FROM rooms WHERE status = 'available') as available_rooms, (SELECT COUNT(*) FROM rooms WHERE status = 'occupied') as occupied_rooms, (SELECT COUNT(*) FROM applications WHERE status = 'approved') as total_approved, (SELECT COUNT(*) FROM complaints WHERE status = 'resolved') as resolved_complaints`);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load stats', error: err.message });
  }
});

router.get('/testimonials', async (req, res) => {
  const testimonials = [
    { id: 1, text: "I made a complaint to the hostel management concerning my bed that I was using in the hostel. The next day I received a replacement. The response was swift and professional.", author: "Ebube Oliver", level: "200 Level", department: "Computer Science" },
    { id: 2, text: "There was an electrical fault in my room, so I made a complaint about it and I was attended to immediately. The maintenance team is always on standby.", author: "Oluwatosin Emmanuel", level: "300 Level", department: "Electrical Engineering" },
    { id: 3, text: "Living here has been an amazing experience. The 24/7 power supply and high-speed internet make studying so much easier. I feel safe and at home.", author: "Chioma Adeleke", level: "100 Level", department: "Mass Communication" }
  ];
  res.json({ success: true, data: testimonials });
});

router.get('/routine', async (req, res) => {
  const routine = [
    { time: "morning", icon: "fa-sun", title: "Morning", description: "Fresh start with a clean environment and preparation for classes." },
    { time: "afternoon", icon: "fa-book-open", title: "Afternoon", description: "Nutritious lunch, rest and personal time after school." },
    { time: "evening", icon: "fa-people-group", title: "Evening", description: "Study time, group discussions and academic support." },
    { time: "night", icon: "fa-moon", title: "Night", description: "Relaxation, lights-out routine and a peaceful night's sleep." }
  ];
  res.json({ success: true, data: routine });
});

module.exports = router;
