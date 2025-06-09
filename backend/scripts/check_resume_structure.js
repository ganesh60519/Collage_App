const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkResumeTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    const [columns] = await connection.execute('DESCRIBE resumes');
    //console.log('Current resume table columns:');
    columns.forEach((col, index) => {
      //console.log(`${index + 1}. ${col.Field} (${col.Type})`);
    });
    
    // Check for duplicate reference columns
    const referenceColumns = columns.filter(col => 
      col.Field.toLowerCase().includes('reference') || 
      col.Field.toLowerCase().includes('references')
    );
    
    if (referenceColumns.length > 1) {
      //console.log('\n⚠️  Found duplicate reference columns:');
      referenceColumns.forEach(col => {
        //console.log(`- ${col.Field}`);
      });
    }
    
  } catch (error) {
    //console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkResumeTable();