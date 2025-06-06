const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateResumeSchema() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    // Create a direct connection to the database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('Connected to database successfully');
    
    // Check current table structure
    console.log('Checking current table structure...');
    const [currentColumns] = await connection.execute('DESCRIBE resumes');
    
    console.log('Current columns:');
    const existingColumns = currentColumns.map(col => col.Field.toLowerCase());
    console.log(existingColumns);
    
    // Define new columns to add
    const newColumns = [
      // Personal Information
      { name: 'objective', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'linkedin', type: 'VARCHAR(255)' },
      { name: 'github', type: 'VARCHAR(255)' },
      { name: 'portfolio', type: 'VARCHAR(255)' },
      
      // Academic Information
      { name: 'gpa', type: 'VARCHAR(20)' },
      { name: 'coursework', type: 'TEXT' },
      { name: 'academic_achievements', type: 'TEXT' },
      
      // Professional Information
      { name: 'technical_skills', type: 'TEXT' },
      { name: 'soft_skills', type: 'TEXT' },
      { name: 'languages', type: 'TEXT' },
      
      // Additional Information
      { name: 'volunteer_work', type: 'TEXT' },
      { name: 'extracurricular', type: 'TEXT' },
      { name: 'publications', type: 'TEXT' },
      { name: 'references', type: 'TEXT' }
    ];
    
    // Add each new column if it doesn't exist
    console.log('Adding new columns...');
    for (const column of newColumns) {
      if (!existingColumns.includes(column.name.toLowerCase())) {
        console.log(`Adding column: ${column.name}`);
        try {
          await connection.execute(`ALTER TABLE resumes ADD COLUMN ${column.name} ${column.type}`);
          console.log(`Added column: ${column.name}`);
        } catch (err) {
          console.error(`Error adding column ${column.name}:`, err.message);
        }
      } else {
        console.log(`Column ${column.name} already exists, skipping`);
      }
    }
    
    // Verify the updated table structure
    console.log('\nVerifying updated table structure...');
    const [updatedColumns] = await connection.execute('DESCRIBE resumes');
    
    console.log('Updated columns:');
    updatedColumns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type})`);
    });
    
    console.log(`\nTotal columns: ${updatedColumns.length}`);
    console.log('Schema update completed successfully');
    
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    if (connection) {
      console.log('Closing database connection');
      await connection.end();
    }
  }
}

updateResumeSchema();