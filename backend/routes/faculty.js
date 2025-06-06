const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

// Register faculty
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);

    const [result] = await db.execute(
      'INSERT INTO faculty (name, email, password, branch) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, branch]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login faculty
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM faculty WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const faculty = rows[0];
    const isMatch = await bcrypt.compare(password, faculty.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: faculty.id, role: 'faculty' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: 'faculty' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get faculty profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, branch, created_at, updated_at FROM faculty WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign task to student
router.post('/assign-task', auth, async (req, res) => {
  const { title, description, student_id, due_date } = req.body;

  if (!title || !description || !student_id || !due_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // First, verify that the student exists
    const [studentRows] = await db.execute(
      'SELECT id FROM students WHERE id = ?',
      [student_id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Insert task with assigned_by field
    await db.execute(
      'INSERT INTO tasks (title, description, assigned_to, assigned_role, status, due_date, assigned_by) VALUES (?, ?, ?, "student", "pending", ?, ?)',
      [title, description, student_id, due_date, req.user.id]
    );
    res.status(201).json({ message: 'Task assigned successfully' });
  } catch (error) {
    console.error('Task assignment error:', error);
    res.status(500).json({ 
      error: 'Failed to assign task', 
      details: error.message 
    });
  }
});

// Assign task to self (faculty)
router.post('/assign-self-task', auth, async (req, res) => {
  const { title, description, due_date, priority } = req.body;
  const faculty_id = req.user.id;

  if (!title || !description || !due_date) {
    return res.status(400).json({ error: 'Title, description, and due date are required' });
  }

  try {
    console.log(`Faculty ${faculty_id} assigning task to self with data:`, req.body);
    
    // Insert task with faculty as both assigner and assignee
    await db.execute(
      'INSERT INTO tasks (title, description, assigned_to, assigned_role, status, due_date, assigned_by, priority) VALUES (?, ?, ?, "faculty", "pending", ?, ?, ?)',
      [title, description, faculty_id, due_date, faculty_id, priority || 'medium']
    );
    
    res.status(201).json({ message: 'Task assigned to self successfully' });
  } catch (error) {
    console.error('Self task assignment error:', error);
    res.status(500).json({ 
      error: 'Failed to assign task to self', 
      details: error.message 
    });
  }
});

// Assign task to self (faculty)
router.post('/assign-self-task', auth, async (req, res) => {
  const { title, description, due_date } = req.body;

  if (!title || !description || !due_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const faculty_id = req.user.id;
    console.log(`Faculty ${faculty_id} assigning task to self: ${title}`);
    
    // Insert task with faculty as both assigner and assignee
    const [result] = await db.execute(
      'INSERT INTO tasks (title, description, assigned_to, assigned_role, status, due_date, assigned_by) VALUES (?, ?, ?, "faculty", "pending", ?, ?)',
      [title, description, faculty_id, due_date, faculty_id]
    );
    
    console.log(`Self-assigned task created with ID: ${result.insertId}`);
    res.status(201).json({ 
      message: 'Task self-assigned successfully',
      task_id: result.insertId
    });
  } catch (error) {
    console.error('Self task assignment error:', error);
    res.status(500).json({ 
      error: 'Failed to self-assign task', 
      details: error.message 
    });
  }
});

// Get list of tasks assigned to students or self
router.get('/tasks', auth, async (req, res) => {
  try {
    const taskType = req.query.type || 'assigned'; // 'assigned' or 'self'
    const faculty_id = req.user.id;
    
    console.log(`Fetching ${taskType} tasks for faculty ID: ${faculty_id}`);
    
    let query, params;
    
    if (taskType === 'self') {
      // Get self-assigned tasks (tasks assigned to the faculty)
      query = 'SELECT t.*, f.name AS faculty_name FROM tasks t LEFT JOIN faculty f ON t.assigned_to = f.id WHERE t.assigned_role = "faculty" AND t.assigned_to = ?';
      params = [faculty_id];
    } else {
      // Get tasks assigned to students by this faculty (default)
      query = 'SELECT t.*, s.name AS student_name FROM tasks t LEFT JOIN students s ON t.assigned_to = s.id WHERE t.assigned_role = "student" AND t.assigned_by = ?';
      params = [faculty_id];
    }
    
    const [tasks] = await db.execute(query, params);
    
    // Log the first task for debugging
    if (tasks.length > 0) {
      console.log(`Faculty API - First ${taskType} task details:`, JSON.stringify(tasks[0], null, 2));
    } else {
      console.log(`No ${taskType} tasks found for faculty ID: ${faculty_id}`);
    }
    
    res.json(tasks || []); // Return empty array if no tasks
  } catch (error) {
    console.error(`Error fetching ${req.query.type || 'assigned'} tasks:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Assign a task to self (faculty)
router.post('/assign-self-task', auth, async (req, res) => {
  try {
    const { title, description, due_date, priority } = req.body;
    const faculty_id = req.user.id;
    
    // Validate required fields
    if (!title || !description || !due_date) {
      return res.status(400).json({ error: 'Title, description, and due date are required' });
    }
    
    console.log(`Faculty ${faculty_id} assigning task to self with data:`, req.body);
    
    // Insert task with faculty as both assigner and assignee
    const [result] = await db.execute(
      'INSERT INTO tasks (title, description, assigned_to, assigned_role, status, due_date, assigned_by, priority) VALUES (?, ?, ?, "faculty", "pending", ?, ?, ?)',
      [title, description, faculty_id, due_date, faculty_id, priority || 'medium']
    );
    
    console.log(`Self-assigned task created with ID: ${result.insertId}`);
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Task assigned to self successfully' 
    });
  } catch (error) {
    console.error('Error assigning self task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of self-assigned tasks (tasks assigned to faculty themselves)
router.get('/self-tasks', auth, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    console.log(`Fetching self-assigned tasks for faculty ID: ${faculty_id}`);
    
    const [tasks] = await db.execute(
      'SELECT t.*, f.name AS faculty_name FROM tasks t LEFT JOIN faculty f ON t.assigned_to = f.id WHERE t.assigned_role = "faculty" AND t.assigned_to = ?',
      [faculty_id]
    );
    
    // Log the first task for debugging
    if (tasks.length > 0) {
      console.log('Faculty API - First self-assigned task details:', JSON.stringify(tasks[0], null, 2));
    } else {
      console.log('No self-assigned tasks found for faculty ID:', faculty_id);
    }
    
    res.json(tasks || []); // Return empty array if no tasks
  } catch (error) {
    console.error('Error fetching self-assigned tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific task's details
router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log(`Fetching details for task ID: ${taskId}`);
    
    const [tasks] = await db.execute(
      'SELECT t.*, s.name AS student_name FROM tasks t LEFT JOIN students s ON t.assigned_to = s.id WHERE t.id = ? AND t.assigned_by = ?',
      [taskId, req.user.id]
    );
    
    if (tasks.length === 0) {
      console.log(`Task not found or not assigned by faculty ID: ${req.user.id}`);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Task details:', JSON.stringify(tasks[0], null, 2));
    res.json(tasks[0]);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of students
router.get('/students', auth, async (req, res) => {
  try {
    const [students] = await db.execute('SELECT id, name FROM students');
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh token endpoint
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Generate a new token with the same user information
    const token = jwt.sign(
      { id: req.user.id, role: 'faculty' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of self-assigned tasks (tasks assigned to faculty themselves)
router.get('/self-tasks', auth, async (req, res) => {
  try {
    const faculty_id = req.user.id;
    console.log(`Fetching self-assigned tasks for faculty ID: ${faculty_id}`);
    
    const [tasks] = await db.execute(
      'SELECT t.*, f.name AS faculty_name FROM tasks t LEFT JOIN faculty f ON t.assigned_to = f.id WHERE t.assigned_role = "faculty" AND t.assigned_to = ?',
      [faculty_id]
    );
    
    // Log the first task for debugging
    if (tasks.length > 0) {
      console.log('Faculty API - First self-assigned task details:', JSON.stringify(tasks[0], null, 2));
    } else {
      console.log('No self-assigned tasks found for faculty ID:', faculty_id);
    }
    
    res.json(tasks || []); // Return empty array if no tasks
  } catch (error) {
    console.error('Error fetching self-assigned tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific self-assigned task's details
router.get('/self-tasks/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const faculty_id = req.user.id;
    
    console.log(`Fetching self-assigned task ${taskId} for faculty ${faculty_id}`);
    
    // Get task details
    const [tasks] = await db.execute(
      'SELECT t.*, f.name AS faculty_name FROM tasks t LEFT JOIN faculty f ON t.assigned_to = f.id WHERE t.id = ? AND t.assigned_to = ? AND t.assigned_role = "faculty"',
      [taskId, faculty_id]
    );
    
    if (tasks.length === 0) {
      console.log(`Self-assigned task ${taskId} not found for faculty ${faculty_id}`);
      return res.status(404).json({ error: 'Self-assigned task not found' });
    }
    
    console.log(`Found self-assigned task:`, JSON.stringify(tasks[0], null, 2));
    res.json(tasks[0]);
  } catch (error) {
    console.error('Error fetching self-assigned task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update self-assigned task status
router.put('/self-tasks/:id/status', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    const faculty_id = req.user.id;
    
    console.log(`Faculty ${faculty_id} updating self-assigned task ${taskId} status to ${status}`);
    
    if (!status || !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Verify the task exists and is assigned to this faculty
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ? AND assigned_role = "faculty"',
      [taskId, faculty_id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task status
    const [updateResult] = await db.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, taskId]
    );
    
    console.log(`Self-assigned task ${taskId} status updated to ${status}`);
    console.log('Update result:', JSON.stringify(updateResult, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Self-assigned task status updated successfully',
      task_id: taskId,
      new_status: status
    });
  } catch (error) {
    console.error('Error updating self-assigned task status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update self-assigned task link
router.put('/self-tasks/:id/link', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { link } = req.body;
    const faculty_id = req.user.id;
    
    console.log(`Faculty ${faculty_id} updating self-assigned task ${taskId} link`);
    console.log(`New link: ${link}`);
    
    // Verify the task exists and is assigned to this faculty
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ? AND assigned_role = "faculty"',
      [taskId, faculty_id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task link
    const [updateResult] = await db.execute(
      'UPDATE tasks SET link = ? WHERE id = ?',
      [link, taskId]
    );
    
    console.log(`Self-assigned task ${taskId} link updated`);
    console.log('Update result:', JSON.stringify(updateResult, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Self-assigned task link updated successfully',
      task_id: taskId
    });
  } catch (error) {
    console.error('Error updating self-assigned task link:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;