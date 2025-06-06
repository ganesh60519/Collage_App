-- SQL script to update task status
-- Usage: Replace the task_id value with the actual task ID you want to update

-- Update a specific task to 'completed' status
UPDATE tasks 
SET status = 'completed' 
WHERE id = 1;  -- Replace 1 with the actual task ID

-- Verify the update
SELECT id, title, status, assigned_to, assigned_role 
FROM tasks 
WHERE id = 1;  -- Replace 1 with the actual task ID