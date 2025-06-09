const db = require('./db');

async function testDB() {
  try {
    //console.log('Testing database connection...');
    const [result] = await db.execute('SELECT 1 as test');
    //console.log('Database connection successful:', result);
    
    //console.log('Checking if students table exists...');
    const [tables] = await db.execute("SHOW TABLES LIKE 'students'");
    //console.log('Students table check:', tables);
    
    if (tables.length > 0) {
      //console.log('Checking students table structure...');
      const [structure] = await db.execute('DESCRIBE students');
      //console.log('Students table structure:', structure);
      
      //console.log('Checking current data in students table...');
      const [data] = await db.execute('SELECT * FROM students');
      //console.log('Current students data:', data);
    } else {
      //console.log('Students table does not exist!');
    }

    //console.log('Checking if faculty table exists...');
    const [facultyTables] = await db.execute("SHOW TABLES LIKE 'faculty'");
    //console.log('Faculty table check:', facultyTables);
    
    if (facultyTables.length > 0) {
      //console.log('Checking current data in faculty table...');
      const [facultyData] = await db.execute('SELECT * FROM faculty');
      //console.log('Current faculty data:', facultyData);
    }

    //console.log('Checking if admin table exists...');
    const [adminTables] = await db.execute("SHOW TABLES LIKE 'admin'");
    //console.log('Admin table check:', adminTables);
    
    if (adminTables.length > 0) {
      //console.log('Checking current data in admin table...');
      const [adminData] = await db.execute('SELECT * FROM admin');
      //console.log('Current admin data:', adminData);
    }

    // Example login logic
    const email = 'example@example.com'; // Replace with actual email
    const password = 'password'; // Replace with actual password
    const [rows] = await db.execute(
      'SELECT * FROM students WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 1) {
      //console.log('Login success');
    } else {
      //console.log('Login failed');
    }

  } catch (error) {
    //console.error('Database test failed:', error);
  }
  process.exit(0);
}

testDB();