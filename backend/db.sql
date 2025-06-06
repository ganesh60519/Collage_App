-- University Application Database Schema
-- Database: university_app
-- Created: Based on analysis of frontend and backend code

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS university_app;
USE university_app;

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =============================================
-- ADMIN TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- FACULTY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- STUDENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    profile_edit BOOLEAN DEFAULT FALSE,
    roll_number VARCHAR(50),
    department VARCHAR(100),
    year_of_study VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- TASKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_by INT NOT NULL,
    assigned_to INT NOT NULL,
    assigned_role ENUM('student', 'faculty') NOT NULL,
    status ENUM('pending', 'in progress', 'completed') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE,
    link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    INDEX idx_assigned_by (assigned_by),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_assigned_role (assigned_role)
);

-- =============================================
-- TICKETS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'general',
    raised_by INT NOT NULL,
    role ENUM('student', 'faculty') NOT NULL,
    status ENUM('open', 'pending', 'approved', 'closed') DEFAULT 'open',
    response TEXT,
    requested_updates TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (raised_by) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_raised_by (raised_by),
    INDEX idx_status (status),
    INDEX idx_type (type)
);

-- =============================================
-- RESUMES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    
    -- Personal Information
    objective TEXT,
    address TEXT,
    phone VARCHAR(20),
    linkedin VARCHAR(255),
    github VARCHAR(255),
    portfolio VARCHAR(255),
    
    -- Academic Information
    education TEXT,
    gpa VARCHAR(20),
    coursework TEXT,
    academic_achievements TEXT,
    
    -- Skills and Languages
    skills TEXT,
    technical_skills TEXT,
    soft_skills TEXT,
    languages TEXT,
    
    -- Professional Experience
    experience TEXT,
    projects TEXT,
    certifications TEXT,
    achievements TEXT,
    
    -- Additional Information
    volunteer_work TEXT,
    extracurricular TEXT,
    publications TEXT,
    resume_reference TEXT,
    references_info TEXT,
    additional_info TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Email indexes for login performance
CREATE INDEX idx_admin_email ON admin(email);
CREATE INDEX idx_faculty_email ON faculty(email);
CREATE INDEX idx_students_email ON students(email);

-- Branch indexes for filtering
CREATE INDEX idx_faculty_branch ON faculty(branch);
CREATE INDEX idx_students_branch ON students(branch);

-- Task-related indexes
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Ticket-related indexes
CREATE INDEX idx_tickets_created_at ON tickets(created_at);

-- =============================================
-- SAMPLE DATA (OPTIONAL)
-- =============================================

-- (All INSERT statements removed)

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for student tasks with assignee information
CREATE OR REPLACE VIEW student_tasks_view AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.link,
    t.created_at,
    s.name AS student_name,
    s.email AS student_email,
    s.branch AS student_branch,
    f.name AS assigned_by_name
FROM tasks t
JOIN students s ON t.assigned_to = s.id
LEFT JOIN faculty f ON t.assigned_by = f.id
WHERE t.assigned_role = 'student';

-- View for faculty tasks with assignee information
CREATE OR REPLACE VIEW faculty_tasks_view AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.link,
    t.created_at,
    f.name AS faculty_name,
    f.email AS faculty_email,
    f.branch AS faculty_branch,
    COALESCE(f2.name, a.name) AS assigned_by_name
FROM tasks t
JOIN faculty f ON t.assigned_to = f.id
LEFT JOIN faculty f2 ON t.assigned_by = f2.id
LEFT JOIN admin a ON t.assigned_by = a.id
WHERE t.assigned_role = 'faculty';

-- View for tickets with student information
CREATE OR REPLACE VIEW tickets_view AS
SELECT 
    t.id,
    t.subject,
    t.description,
    t.type,
    t.status,
    t.response,
    t.requested_updates,
    t.created_at,
    s.name AS raised_by_name,
    s.email AS raised_by_email,
    s.branch AS raised_by_branch
FROM tickets t
JOIN students s ON t.raised_by = s.id;

-- =============================================
-- STORED PROCEDURES
-- =============================================

-- Procedure to get student dashboard data
DELIMITER //
CREATE PROCEDURE GetStudentDashboard(IN student_id INT)
BEGIN
    -- Get student profile
    SELECT id, name, email, branch, profile_edit 
    FROM students 
    WHERE id = student_id;
    
    -- Get student tasks
    SELECT id, title, description, status, priority, due_date, link, created_at
    FROM tasks 
    WHERE assigned_to = student_id AND assigned_role = 'student'
    ORDER BY due_date ASC, created_at DESC;
    
    -- Get student tickets
    SELECT id, subject, description, type, status, response, created_at
    FROM tickets 
    WHERE raised_by = student_id
    ORDER BY created_at DESC;
END //
DELIMITER ;

-- Procedure to get faculty dashboard data
DELIMITER //
CREATE PROCEDURE GetFacultyDashboard(IN faculty_id INT)
BEGIN
    -- Get faculty profile
    SELECT id, name, email, branch, created_at
    FROM faculty 
    WHERE id = faculty_id;
    
    -- Get tasks assigned by faculty to students
    SELECT t.id, t.title, t.description, t.status, t.priority, t.due_date, 
           s.name AS student_name, t.created_at
    FROM tasks t
    JOIN students s ON t.assigned_to = s.id
    WHERE t.assigned_by = faculty_id AND t.assigned_role = 'student'
    ORDER BY t.due_date ASC, t.created_at DESC;
    
    -- Get self-assigned tasks
    SELECT id, title, description, status, priority, due_date, created_at
    FROM tasks 
    WHERE assigned_to = faculty_id AND assigned_role = 'faculty'
    ORDER BY due_date ASC, created_at DESC;
END //
DELIMITER ;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update timestamps
DELIMITER //
CREATE TRIGGER update_student_timestamp 
    BEFORE UPDATE ON students
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER update_faculty_timestamp 
    BEFORE UPDATE ON faculty
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER update_admin_timestamp 
    BEFORE UPDATE ON admin
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- =============================================
-- FINAL SETUP
-- =============================================

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON university_app.* TO 'your_app_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Display table information
SELECT 'Database schema created successfully!' AS message;
SHOW TABLES;

SELECT * FROM students;
SELECT * FROM faculty;
SELECT * FROM admin;