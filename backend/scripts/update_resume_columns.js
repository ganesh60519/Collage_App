const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateResumeColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    // Add missing columns if they don't exist
    const alterQueries = [
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS objective TEXT AFTER student_id',
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS educationskills TEXT AFTER objective',
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS languages TEXT AFTER educationskills',
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS experience TEXT AFTER languages',
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS projects TEXT AFTER experience',
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS certifications TEXT AFTER projects',
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS achievements TEXT AFTER certifications',
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS reference_info TEXT AFTER achievements',
      'ALTER TABLE resumes ADD COLUMN IF NOT EXISTS additional_info TEXT AFTER reference_info'
    ];

    for (const query of alterQueries) {
      await connection.execute(query);
    }

    // Verify the updated structure
    const [columns] = await connection.execute('DESCRIBE resumes');
    //console.log('Updated resume table columns:');
    columns.forEach(col => {
      //console.log(`- ${col.Field} (${col.Type})`);
    });

    //console.log('Resume table updated successfully');
  } catch (error) {
    //console.error('Error updating resume table:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateResumeColumns();