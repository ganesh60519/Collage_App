@echo off
echo Task Status Updater
echo =================
echo.

if "%1"=="" (
  echo Error: Task ID is required
  echo Usage: update_task.bat [taskId] [status]
  echo Example: update_task.bat 1 completed
  exit /b 1
)

set TASK_ID=%1
set STATUS=%2

if "%STATUS%"=="" (
  set STATUS=completed
)

echo Updating task %TASK_ID% to status "%STATUS%"...
echo.

node update_task_db.js %TASK_ID% %STATUS%

echo.
pause