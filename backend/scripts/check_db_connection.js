const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkConnection() {
  try {
    //console.log('Environment variables:');
    //console.log(`DB_HOST: ${process.env.DB_HOST}`);
    //console.log(`DB_USER: ${process.env.DB_USER}`);
    //console.log(`DB_NAME: ${process.env.DB_NAME}`);
    //console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '[REDACTED]' : 'Not set'}`);
    
    //console.log('\nAttempting to connect to database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    //console.log('Connected to database successfully!');
    
    // Check if the resumes table exists
    //console.log('\nChecking if resumes table exists...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "resumes"');
    
    if (tables.length === 0) {
      //console.log('Resumes table does not exist!');
    } else {
      //console.log('Resumes table exists.');
      
      // Get table structure
      //console.log('\nGetting table structure...');
      const [columns] = await connection.execute('DESCRIBE resumes');
      
      //console.log('Columns in resumes table:');
      columns.forEach(col => {
        //console.log(`- ${col.Field} (${col.Type})`);
      });
    }
    
    await connection.end();
    //console.log('\nConnection closed.');
    
  } catch (error) {
    //console.error('Error:', error);
  }
}

checkConnection();