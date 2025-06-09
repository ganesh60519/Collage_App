const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Task update API is working' });
});

// Update task status
router.post('/complete/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    //console.log(`Completing task ${taskId} for user ${req.user.id}`);
    
    // Verify the task belongs to the student
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ?',
      [taskId, req.user.id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task status to completed
    await db.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      ['completed', taskId]
    );
    
    //console.log(`Task ${taskId} marked as completed successfully`);
    res.json({ success: true, message: 'Task marked as completed successfully' });
  } catch (error) {
    //console.error('Error completing task:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;