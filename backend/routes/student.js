const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

// Helper function for updating task status
async function updateTaskStatus(req, res, taskId) {
  try {
    const { status } = req.body;
    
    console.log(`Updating task ${taskId} to status: ${status}`);
    console.log(`Request from user ID: ${req.user.id}, role: ${req.user.role}`);
    
    // Validate status
    if (!status || !['pending', 'in progress', 'completed'].includes(status.toLowerCase())) {
      console.log(`Invalid status value: ${status}`);
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Verify the task belongs to the student
    console.log(`Verifying task ownership for task ID: ${taskId}, user ID: ${req.user.id}`);
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ?',
      [taskId, req.user.id]
    );
    
    console.log(`Task query result count: ${tasks.length}`);
    
    if (tasks.length === 0) {
      console.log(`Task not found or not assigned to user ID: ${req.user.id}`);
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task status
    console.log(`Updating task ${taskId} status to ${status.toLowerCase()} in database`);
    
    // Use a transaction to ensure data consistency
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Update the task status
      await connection.execute(
        'UPDATE tasks SET status = ? WHERE id = ?',
        [status.toLowerCase(), taskId]
      );
      
      // Log the status change for debugging
      console.log(`Task ${taskId} status changed from ${tasks[0].status} to ${status.toLowerCase()}`);
      
      await connection.commit();
      
      console.log(`Task ${taskId} status updated successfully to ${status.toLowerCase()}`);
      return res.json({ 
        success: true, 
        message: 'Task status updated successfully',
        taskId: taskId,
        newStatus: status.toLowerCase()
      });
    } catch (txError) {
      await connection.rollback();
      throw txError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Simple test endpoint to verify the server is working
router.get('/test-endpoint', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ success: true, message: 'Test endpoint is working' });
});

// Refresh token endpoint
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Verify that the user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Generate a new token with the same user information
    const token = jwt.sign(
      { id: req.user.id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct update endpoint for completing tasks
router.get('/direct-update', auth, async (req, res) => {
  try {
    const { taskId, userId } = req.query;
    
    if (!taskId || !userId) {
      return res.status(400).json({ error: 'Missing taskId or userId' });
    }
    
    console.log(`Direct update: Completing task ${taskId} for user ${userId}`);
    
    // Verify the task belongs to the user
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ?',
      [taskId, userId]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or not assigned to this user' });
    }
    
    // Update the task status to completed
    await db.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      ['completed', taskId]
    );
    
    console.log(`Task ${taskId} marked as completed successfully via direct update`);
    res.json({ success: true, message: 'Task marked as completed successfully' });
  } catch (error) {
    console.error('Error in direct update:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple endpoint to complete a task (DEPRECATED - use /tasks/:id/status instead)
router.post('/complete-task/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    console.log(`[DEPRECATED ENDPOINT] Completing task ${taskId} for user ${req.user.id}`);
    console.log('This endpoint is deprecated. Please use /tasks/:id/status instead');
    
    // Redirect to the standard endpoint
    req.body.status = 'completed';
    return await updateTaskStatus(req, res, taskId);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register student
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const [result] = await db.execute(
      'INSERT INTO students (name, email, password, branch, profile_edit) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, branch, false]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login student
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM students WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const student = rows[0];
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student.id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: 'student' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get student profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, branch, profile_edit FROM students WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student tasks
router.get('/tasks', auth, async (req, res) => {
  try {
    const [tasks] = await db.execute(
      'SELECT t.* FROM tasks t WHERE t.assigned_to = ? AND t.assigned_role = "student"',
      [req.user.id]
    );
    res.json(tasks || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete a task (DEPRECATED - use /tasks/:id/status instead)
router.post('/tasks/complete/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    console.log(`[DEPRECATED ENDPOINT] Completing task ${taskId} for user ${req.user.id}`);
    console.log('This endpoint is deprecated. Please use /tasks/:id/status instead');
    
    // Redirect to the standard endpoint
    req.body.status = 'completed';
    return await updateTaskStatus(req, res, taskId);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update task status (primary endpoint)
router.put('/tasks/:id/status', auth, async (req, res) => {
  console.log(`Task status update request received for task ID: ${req.params.id}`);
  const taskId = req.params.id;
  return await updateTaskStatus(req, res, taskId);
});

// Update task link
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { link } = req.body;
    
    console.log(`Updating task ${taskId} link`);
    console.log(`Request from user ID: ${req.user.id}, role: ${req.user.role}`);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Verify the task belongs to the student
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ?',
      [taskId, req.user.id]
    );
    
    if (tasks.length === 0) {
      console.log(`Task not found or not assigned to user ID: ${req.user.id}`);
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task link only
    console.log(`Updating task ${taskId} link in database`);
    console.log(`Setting link to: "${link}"`);
    
    const [updateResult] = await db.execute(
      'UPDATE tasks SET link = ? WHERE id = ?',
      [link, taskId]
    );
    
    console.log(`Task ${taskId} link updated successfully`);
    console.log('Update result:', JSON.stringify(updateResult, null, 2));
    
    // Verify the update by fetching the task again
    const [updatedTask] = await db.execute(
      'SELECT id, link FROM tasks WHERE id = ?',
      [taskId]
    );
    
    console.log('Updated task data:', JSON.stringify(updatedTask[0], null, 2));
    res.json({ success: true, message: 'Task link updated successfully' });
  } catch (error) {
    console.error('Error updating task link:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alternative endpoint for updating task status
router.put('/update-task-status/:id', auth, async (req, res) => {
  console.log(`Alternative task status update request received for task ID: ${req.params.id}`);
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    
    console.log(`Updating task ${taskId} to status: ${status}`);
    console.log(`Request from user ID: ${req.user.id}, role: ${req.user.role}`);
    
    // Validate status
    if (!status || !['pending', 'in progress', 'completed'].includes(status.toLowerCase())) {
      console.log(`Invalid status value: ${status}`);
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Verify the task belongs to the student
    console.log(`Verifying task ownership for task ID: ${taskId}, user ID: ${req.user.id}`);
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE id = ? AND assigned_to = ?',
      [taskId, req.user.id]
    );
    
    console.log(`Task query result count: ${tasks.length}`);
    
    if (tasks.length === 0) {
      console.log(`Task not found or not assigned to user ID: ${req.user.id}`);
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }
    
    // Update the task status
    console.log(`Updating task ${taskId} status to ${status.toLowerCase()} in database`);
    await db.execute(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status.toLowerCase(), taskId]
    );
    
    console.log(`Task ${taskId} status updated successfully to ${status.toLowerCase()}`);
    res.json({ success: true, message: 'Task status updated successfully' });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student tickets
router.get('/tickets', auth, async (req, res) => {
  try {
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE raised_by = ?',
      [req.user.id]
    );
    res.json(tickets || []);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.json([]);
  }
});

// Create new ticket
router.post('/tickets', auth, async (req, res) => {
  try {
    const { subject, description } = req.body;
    const [result] = await db.execute(
      'INSERT INTO tickets (subject, description, raised_by, role, status) VALUES (?, ?, ?, "student", "open")',
      [subject, description, req.user.id]
    );
    res.status(201).json({ success: true, ticket_id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create profile update ticket
router.post('/profile-update-ticket', auth, async (req, res) => {
  try {
    const { subject, description, type, requested_updates } = req.body;

    // Set profile_edit to true for the student
    await db.execute(
      'UPDATE students SET profile_edit = ? WHERE id = ?',
      [true, req.user.id]
    );

    // Convert requested_updates to string if it's an object
    const updatesString = typeof requested_updates === 'object' ?
      JSON.stringify(requested_updates) :
      requested_updates;

    // Create ticket
    const [result] = await db.execute(
      'INSERT INTO tickets (subject, description, type, raised_by, role, status, requested_updates) VALUES (?, ?, ?, ?, "student", "pending", ?)',
      [subject, description, type, req.user.id, updatesString]
    );

    res.status(201).json({ message: 'Ticket created successfully', ticketId: result.insertId });
  } catch (error) {
    console.error('Error in profile-update-ticket route:', error);
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
});

// Update student profile after approval
router.put('/profile', auth, async (req, res) => {
  try {
    const { ticket_id, updates } = req.body;

    // Check if ticket exists and is approved
    const [tickets] = await db.execute(
      'SELECT * FROM tickets WHERE id = ? AND status = "approved" AND type = "profile_update"',
      [ticket_id]
    );

    if (tickets.length === 0) {
      return res.status(403).json({ error: 'No approved ticket found for profile update' });
    }

    // Validate updates object
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    // Define allowed fields to prevent SQL injection
    const allowedFields = ['name', 'email', 'branch'];
    const updateFields = Object.keys(updates).filter(field => allowedFields.includes(field));

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Build the SET clause dynamically
    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE students SET ${setClause}, profile_edit = ? WHERE id = ?`;

    // Collect values for the placeholders
    const values = [...updateFields.map(field => updates[field]), false, req.user.id];

    // Execute the update query
    const [result] = await db.execute(query, values);

    // Mark ticket as completed
    await db.execute(
      'UPDATE tickets SET status = "completed" WHERE id = ?',
      [ticket_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume routes

// Test resume endpoint
router.get('/resume-test', async (req, res) => {
  try {
    res.json({ message: 'Resume test endpoint working' });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student resume
router.get('/resume', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM resumes WHERE student_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found', exists: false });
    }

    // Get student information to include with resume
    const [studentInfo] = await db.execute(
      'SELECT name, email, branch FROM students WHERE id = ?',
      [req.user.id]
    );

    if (studentInfo.length === 0) {
      return res.status(404).json({ error: 'Student information not found' });
    }

    // Combine resume and student info
    const resumeData = {
      ...rows[0],
      studentInfo: studentInfo[0],
      exists: true
    };

    res.json(resumeData);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update student resume
router.post('/resume', auth, async (req, res) => {
  try {
    const { 
      objective, education, skills, languages, experience, projects, 
      certifications, achievements, references_info, additional_info 
    } = req.body;

    // Check if resume already exists
    const [existingResume] = await db.execute(
      'SELECT id FROM resumes WHERE student_id = ?',
      [req.user.id]
    );

    if (existingResume.length > 0) {
      // Update existing resume with all fields
      await db.execute(
        `UPDATE resumes SET 
          objective = ?, 
          education = ?, 
          skills = ?, 
          languages = ?, 
          experience = ?, 
          projects = ?, 
          certifications = ?, 
          achievements = ?, 
          references_info = ?, 
          additional_info = ? 
        WHERE student_id = ?`,
        [
          objective || null, 
          education || null, 
          skills || null, 
          languages || null, 
          experience || null, 
          projects || null, 
          certifications || null, 
          achievements || null, 
          references_info || null, 
          additional_info || null, 
          req.user.id
        ]
      );
      res.json({ success: true, message: 'Resume updated successfully' });
    } else {
      // Create new resume with all fields
      await db.execute(
        `INSERT INTO resumes (
          student_id, objective, education, skills, languages, experience, 
          projects, certifications, achievements, references_info, additional_info
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id, 
          objective || null, 
          education || null, 
          skills || null, 
          languages || null, 
          experience || null, 
          projects || null, 
          certifications || null, 
          achievements || null, 
          references_info || null, 
          additional_info || null
        ]
      );
      res.status(201).json({ success: true, message: 'Resume created successfully' });
    }
  } catch (error) {
    console.error('Error creating/updating resume:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get formatted resume for viewing
router.get('/resume/view', auth, async (req, res) => {
  try {
    // Get resume data
    const [rows] = await db.execute(
      'SELECT * FROM resumes WHERE student_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found', exists: false });
    }

    // Get student information - only select columns that definitely exist
    const [studentInfo] = await db.execute(
      'SELECT name, email, branch FROM students WHERE id = ?',
      [req.user.id]
    );

    if (studentInfo.length === 0) {
      return res.status(404).json({ error: 'Student information not found' });
    }

    // Combine resume and student info
    const resumeData = {
      ...rows[0],
      studentInfo: studentInfo[0],
      exists: true
    };

    res.json({
      success: true,
      resume: resumeData,
      message: 'Resume retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving formatted resume:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate a shareable link for the resume
router.get('/resume/share', auth, async (req, res) => {
  try {
    // Check if resume exists
    const [rows] = await db.execute(
      'SELECT id FROM resumes WHERE student_id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found', exists: false });
    }

    // Generate a unique share ID (you could use a more sophisticated method in production)
    const shareId = Buffer.from(`${req.user.id}-${Date.now()}`).toString('base64');
    
    // In a production app, you would store this share ID in the database
    // For this example, we'll just return it
    
    // Create a shareable URL
    const shareUrl = `http://${process.env.HOST || 'localhost'}:3000/api/student/resume/public/${shareId}`;
    
    res.json({
      success: true,
      shareUrl,
      shareId,
      message: 'Resume share link generated successfully'
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import PDF generator
const { generateResumePDF } = require('../utils/pdfGenerator');

// Public endpoint to view a shared resume
router.get('/resume/public/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const format = req.query.format || 'pdf'; // Default to PDF format
    const requestedTemplate = req.query.template || 'modern'; // Get template from query params, default to modern
    const requestedLayout = req.query.layout || 'single-column'; // Get layout from query params, default to single-column
    const isInline = req.query.inline === 'true'; // Check if this is an inline viewing request
    const isDownload = req.query.download === 'true'; // Check if this is a download request
    
    // Debug log for incoming request
    console.log(`Resume request received - ShareID: ${shareId}, Format: ${format}, Template: ${requestedTemplate}, Layout: ${requestedLayout}, Inline: ${isInline}, Download: ${isDownload}`);
    
    // In a production app, you would validate the shareId against stored values
    // For this example, we'll decode it to get the student ID
    
    const decoded = Buffer.from(shareId, 'base64').toString('utf-8');
    const studentId = parseInt(decoded.split('-')[0]);
    
    if (isNaN(studentId)) {
      console.error(`Invalid share link: ${shareId}, decoded: ${decoded}`);
      return res.status(400).json({ error: 'Invalid share link' });
    }
    
    console.log(`Fetching resume for student ID: ${studentId}`);
    
    // Get resume data
    const [rows] = await db.execute(
      'SELECT * FROM resumes WHERE student_id = ?',
      [studentId]
    );

    if (rows.length === 0) {
      console.error(`Resume not found for student ID: ${studentId}`);
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Get student information (limited for privacy)
    const [studentInfo] = await db.execute(
      'SELECT name, email, branch FROM students WHERE id = ?',
      [studentId]
    );

    if (studentInfo.length === 0) {
      console.error(`Student information not found for ID: ${studentId}`);
      return res.status(404).json({ error: 'Student information not found' });
    }

    console.log(`Retrieved resume data for: ${studentInfo[0].name}`);

    // If JSON format is requested, return JSON
    if (format === 'json') {
      // Combine resume and student info
      const resumeData = {
        ...rows[0],
        studentInfo: studentInfo[0]
      };

      return res.json({
        success: true,
        resume: resumeData,
        message: 'Shared resume retrieved successfully'
      });
    }
    
    // Otherwise, generate and return PDF
    // Validate template parameter
    const validTemplates = ['modern', 'classic', 'executive', 'minimalist', 'creative', 'technical', 'professional', 'academic', 'elegant'];
    let templateToUse = 'modern'; // Default template
    
    // Normalize the template name (lowercase and trim)
    const normalizedTemplate = requestedTemplate.toLowerCase().trim();
    
    if (validTemplates.includes(normalizedTemplate)) {
      templateToUse = normalizedTemplate;
    } else {
      console.warn(`Invalid template requested: "${requestedTemplate}", using default "modern" template`);
    }
    
    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    
    // Set Content-Disposition based on whether this is for viewing or downloading
    // For viewing, use 'inline' to display in browser
    // For download, use 'attachment' to force download
    const fileName = `${studentInfo[0].name.replace(/\s+/g, '_')}_${templateToUse}_Resume.pdf`;
    if (isDownload) {
      // Force download with attachment disposition
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      console.log('Setting attachment disposition for download');
    } else {
      // Default to inline for viewing in browser
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      console.log('Setting inline disposition for viewing in browser');
    }
    
    // Add strong cache control headers to prevent caching issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Add additional headers to prevent browser caching
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('ETag', `${Date.now()}`); // Dynamic ETag to force refresh
    
    // Log the template being used
    console.log(`Generating PDF with template: "${templateToUse}" for student: ${studentInfo[0].name}`);
    
    try {
      // Prepare resume data - ensure it's properly formatted
      const resumeData = {
        objective: rows[0].objective || '',
        education: rows[0].education || '',
        skills: rows[0].skills || '',
        languages: rows[0].languages || '',
        experience: rows[0].experience || '',
        projects: rows[0].projects || '',
        certifications: rows[0].certifications || '',
        achievements: rows[0].achievements || '',
        references_info: rows[0].references_info || '',
        additional_info: rows[0].additional_info || ''
      };
      
      // Generate the PDF and pipe it directly to the response, passing the template
      generateResumePDF(resumeData, studentInfo[0], res, templateToUse);
      
      // Log success
      console.log(`PDF generation initiated for ${studentInfo[0].name} with template ${templateToUse}`);
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      // If PDF generation fails, send an error response
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate PDF', details: pdfError.message });
      }
    }
  } catch (error) {
    console.error('Error retrieving shared resume:', error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;