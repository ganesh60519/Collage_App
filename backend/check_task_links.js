const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTaskLinks() {
  console.log('Checking task links in database...');
  
  // Create a connection to the database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    // Check if the link column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tasks' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columns in tasks table:');
    columns.forEach(column => {
      console.log(`- ${column.COLUMN_NAME}`);
    });
    
    // Get all tasks with their link values
    const [tasks] = await connection.query(`
      SELECT id, title, link 
      FROM tasks 
      ORDER BY id
    `);
    
    console.log('\nTasks with their link values:');
    tasks.forEach(task => {
      console.log(`Task ID: ${task.id}, Title: ${task.title}, Link: ${task.link === null ? 'NULL' : task.link}`);
    });
    
    // Count tasks with non-null links
    const [linkCount] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE link IS NOT NULL
    `);
    
    console.log(`\nNumber of tasks with non-null links: ${linkCount[0].count}`);
    
    // If there are no tasks with links, insert a test link
    if (linkCount[0].count === 0) {
      console.log('\nNo tasks with links found. Adding a test link to the first task...');
      
      // Get the first task
      const [firstTask] = await connection.query(`
        SELECT id FROM tasks LIMIT 1
      `);
      
      if (firstTask.length > 0) {
        const taskId = firstTask[0].id;
        await connection.query(`
          UPDATE tasks 
          SET link = 'https://example.com/test-link' 
          WHERE id = ?
        `, [taskId]);
        
        console.log(`Added test link to task ID: ${taskId}`);
      } else {
        console.log('No tasks found in the database');
      }
    }
    
  } catch (error) {
    console.error('Error checking task links:', error);
  } finally {
    // Close the connection
    await connection.end();
    console.log('Database connection closed');
  }
}

// Run the function
checkTaskLinks();