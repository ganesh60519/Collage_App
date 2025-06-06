-- Select the database
USE university_app;

-- Add profile_edit field to students table
ALTER TABLE students ADD COLUMN profile_edit BOOLEAN DEFAULT FALSE;

-- Update existing records to set profile_edit to false
UPDATE students SET profile_edit = FALSE WHERE profile_edit IS NULL;