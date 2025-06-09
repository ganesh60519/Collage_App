const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Update task status
router.put('/:id/status', auth, async (req, res) => {
  //console.log(`Task status update request received for task ID: ${req.params.id}`);
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    
    //console.log(`Updating task ${taskId} to status: ${status}`);
    //console.log(`Request from user ID: ${req.user.id}, role: ${req.user.role}`);
    
    // Validate status
    if (!status || !['pending', 'in progress', 'completed'].includes(status.toLowerCase())) {
      //console.log(`Invalid status value: ${status}`);
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Verify the task belongs to the user
    //console.log(`Verifying task ownership for task ID: ${taskId}, user ID: ${req.user.id}`);
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ?',
      [taskId, req.user.id]
    );
    
    //console.log(`Task query result count: ${tasks.length}`);
    
    if (tasks.length === 0) {
      //console.log(`Task not found or not assigned to user ID: ${req.user.id}`);
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task status
    //console.log(`Updating task ${taskId} status to ${status.toLowerCase()} in database`);
    await db.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status.toLowerCase(), taskId]
    );
    
    //console.log(`Task ${taskId} status updated successfully to ${status.toLowerCase()}`);
    res.json({ success: true, message: 'Task status updated successfully' });
  } catch (error) {
    //console.error('Error updating task status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;