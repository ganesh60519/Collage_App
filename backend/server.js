const express = require('express');
const cors = require('cors');
require('dotenv').config();
const IP = require('./ip');
const pool = require('./db');

const app = express();

// Test database connection and create tables if needed
pool.getConnection()
   .then(async conn => {
     console.log('Database connected successfully');
     
     // Create students table if it doesn't exist
     try {
       await pool.execute(`
         CREATE TABLE IF NOT EXISTS students (
           id INT AUTO_INCREMENT PRIMARY KEY,
           name VARCHAR(255),
           email VARCHAR(255) UNIQUE,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )
       `);
       console.log('Students table created or verified successfully');
     } catch (error) {
       console.error('Error creating students table:', error);
     }
     
     // Create resume table if it doesn't exist
     try {
       await pool.execute(`
         CREATE TABLE IF NOT EXISTS resumes (
           id INT AUTO_INCREMENT PRIMARY KEY,
           student_id INT NOT NULL,
           education TEXT,
           skills TEXT,
           experience TEXT,
           projects TEXT,
           certifications TEXT,
           achievements TEXT,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
           FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
         )
       `);
       console.log('Resume table created or verified successfully');
     } catch (error) {
       console.error('Error creating resume table:', error);
     }
     
     conn.release();
   })
   .catch(err => {
     console.error('Database connection failed:', err);
   });

app.use(cors());
app.use(express.json());

// Import routes
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');
const taskRoutes = require('./routes/tasks');
const taskUpdateRoutes = require('./routes/taskUpdate');

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Use routes
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-update', taskUpdateRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, IP, () => {
  console.log(`Server running on http://${IP}:${PORT}`);
});