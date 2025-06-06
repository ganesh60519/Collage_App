const db = require('../db');

async function createResumeTable() {
  try {
    await db.execute(`
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
    console.log('Resume table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating resume table:', error);
    process.exit(1);
  }
}

createResumeTable();