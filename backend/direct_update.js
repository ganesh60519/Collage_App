const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'uni_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to complete a task
async function completeTask(taskId) {
  try {
    //console.log(`Attempting to complete task ${taskId}`);
    
    // Update the task status to completed
    const [result] = await pool.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      ['completed', taskId]
    );
    
    if (result.affectedRows > 0) {
      //console.log(`Task ${taskId} marked as completed successfully`);
      return true;
    } else {
      //console.log(`No task with ID ${taskId} was found`);
      return false;
    }
  } catch (error) {
    //console.error('Error completing task:', error);
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Get task ID from command line arguments
const taskId = process.argv[2];

if (!taskId) {
  //console.error('Usage: node direct_update.js <taskId>');
  process.exit(1);
}

// Complete the task
completeTask(taskId)
  .then(success => {
    if (success) {
      //console.log('Task completed successfully');
    } else {
      //console.error('Failed to complete task');
    }
    process.exit(0);
  })
  .catch(error => {
    //console.error('Error:', error);
    process.exit(1);
  });