const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './database/hostel.db';
const dbPath = path.resolve(DB_PATH);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at', dbPath);
});

db.run('PRAGMA foreign_keys = ON');

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matric_number TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        department TEXT NOT NULL,
        level TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
        date_of_birth TEXT,
        address TEXT,
        guardian_name TEXT,
        guardian_phone TEXT,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'super_admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );
      CREATE TABLE IF NOT EXISTS room_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        capacity INTEGER NOT NULL,
        price_per_semester REAL NOT NULL,
        amenities TEXT,
        image_url TEXT,
        available_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT UNIQUE NOT NULL,
        room_type_id INTEGER NOT NULL,
        block TEXT NOT NULL,
        floor INTEGER,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id)
      );
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        room_type_id INTEGER NOT NULL,
        preferred_block TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'waitlisted')),
        payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'partial')),
        application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        processed_by INTEGER,
        rejection_reason TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (room_type_id) REFERENCES room_types(id),
        FOREIGN KEY (processed_by) REFERENCES admins(id)
      );
      CREATE TABLE IF NOT EXISTS allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        allocated_by INTEGER,
        semester TEXT NOT NULL,
        year INTEGER NOT NULL,
        FOREIGN KEY (application_id) REFERENCES applications(id),
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (allocated_by) REFERENCES admins(id)
      );
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'unread' CHECK(status IN ('unread', 'read', 'replied')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        replied_at DATETIME,
        reply_message TEXT
      );
      CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('maintenance', 'security', 'cleanliness', 'noise', 'facilities', 'other')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        room_number TEXT,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        resolution_note TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id)
      );
      CREATE TABLE IF NOT EXISTS complaint_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        update_text TEXT NOT NULL,
        updated_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id),
        FOREIGN KEY (updated_by) REFERENCES admins(id)
      );
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        application_id INTEGER,
        amount REAL NOT NULL,
        payment_type TEXT NOT NULL CHECK(payment_type IN ('application', 'room', 'damage', 'other')),
        transaction_ref TEXT UNIQUE,
        payment_method TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed', 'refunded')),
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (application_id) REFERENCES applications(id)
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('student', 'admin')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error')),
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins(id)
      );
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
      CREATE INDEX IF NOT EXISTS idx_students_matric ON students(matric_number);
      CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_complaints_student ON complaints(student_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type);
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const seedData = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      db.run(`INSERT OR IGNORE INTO admins (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
        [process.env.ADMIN_EMAIL || 'admin@yabatechhostel.edu.ng', adminPassword, 'System Administrator', 'super_admin'],
        function(err) { if (err) console.log('Admin might already exist:', err.message); }
      );
      const roomTypes = [
        ['Single Room', 'Private room for one student with study desk and wardrobe', 1, 150000, 'Desk, Wardrobe, Fan, Reading Light', 'images/single-room.jpg', 20, 50],
        ['Double Room', 'Shared room for two students with individual study desks', 2, 100000, '2 Desks, 2 Wardrobes, Fan, Reading Light', 'images/double-room.jpg', 30, 80],
        ['Triple Room', 'Room for three students with smart storage', 3, 75000, '3 Desks, 3 Lockers, Fan, Reading Light', 'images/triple-room.jpg', 15, 45],
        ['Quad Room', 'Spacious room for four students with bunk beds', 4, 60000, '4 Desks, 4 Lockers, Fan, Reading Light', 'images/quad-room.jpg', 10, 30]
      ];
      const stmt = db.prepare(`INSERT OR IGNORE INTO room_types (name, description, capacity, price_per_semester, amenities, image_url, available_count, total_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      roomTypes.forEach(rt => stmt.run(rt));
      stmt.finalize();
      db.get('SELECT COUNT(*) as count FROM rooms', [], (err, row) => {
        if (row && row.count === 0) {
          const blocks = ['A', 'B', 'C', 'D'];
          let roomCount = 0;
          const roomStmt = db.prepare(`INSERT INTO rooms (room_number, room_type_id, block, floor, status) VALUES (?, ?, ?, ?, ?)`);
          for (let block of blocks) {
            for (let floor = 1; floor <= 3; floor++) {
              for (let unit = 1; unit <= 10; unit++) {
                roomCount++;
                const roomTypeId = (roomCount % 4) + 1;
                const roomNum = `${block}${floor}0${unit}`;
                roomStmt.run(roomNum, roomTypeId, block, floor, 'available');
              }
            }
          }
          roomStmt.finalize();
          console.log(`Created ${roomCount} rooms`);
        }
      });
      console.log('Seed data inserted successfully');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

const init = async () => {
  try {
    await createTables();
    console.log('All tables created successfully');
    await seedData();
    console.log('Database setup complete!');
    console.log('\nDefault admin credentials:');
    console.log('Email:', process.env.ADMIN_EMAIL || 'admin@yabatechhostel.edu.ng');
    console.log('Password:', process.env.ADMIN_PASSWORD || 'admin123');
    console.log('\nIMPORTANT: Change the default admin password after first login!');
  } catch (err) {
    console.error('Setup error:', err.message);
  } finally {
    db.close();
  }
};

init();
