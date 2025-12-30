REM Windows Batch Script to Schedule Enactus Portal Backups
REM Run this as Administrator

@echo off
echo ======================================
echo ENACTUS PORTAL - BACKUP SCHEDULER
echo ======================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Step 1: Building TypeScript...
echo ======================================
cd /d "d:\E-Portal\enactus-portal\server"
call npm run build

if %errorLevel% neq 0 (
    echo ERROR: Build failed. Please fix errors and try again.
    pause
    exit /b 1
)

echo.
echo Build successful!
echo.

echo Step 2: Testing backup script...
echo ======================================
echo Running test backup...
node dist\scripts\backup.js

if %errorLevel% neq 0 (
    echo ERROR: Backup test failed. Please check the script.
    pause
    exit /b 1
)

echo.
echo Test backup successful!
echo.

echo Step 3: Creating scheduled task...
echo ======================================
echo.
echo This will create a weekly backup task that runs every Sunday at 2:00 AM
echo.
echo Task Name: EnactusPortalBackup
echo Schedule: Weekly, Sunday at 2:00 AM
echo Command: node d:\E-Portal\enactus-portal\server\dist\scripts\backup.js
echo.
echo Press any key to continue, or Ctrl+C to cancel...
pause >nul

REM Delete existing task if it exists
schtasks /delete /tn "EnactusPortalBackup" /f >nul 2>&1

REM Create new scheduled task
schtasks /create /tn "EnactusPortalBackup" /tr "cmd /c cd /d d:\E-Portal\enactus-portal\server && node dist\scripts\backup.js >> backup.log 2>&1" /sc weekly /d SUN /st 02:00 /ru SYSTEM /f

if %errorLevel% neq 0 (
    echo ERROR: Failed to create scheduled task.
    echo.
    echo Try creating manually via Task Scheduler:
    echo 1. Open Task Scheduler
    echo 2. Create Basic Task
    echo 3. Name: EnactusPortalBackup
    echo 4. Trigger: Weekly, Sunday, 2:00 AM
    echo 5. Action: Start a program
    echo 6. Program: node
    echo 7. Arguments: dist\scripts\backup.js
    echo 8. Start in: d:\E-Portal\enactus-portal\server
    pause
    exit /b 1
)

echo.
echo ✅ Scheduled task created successfully!
echo.

echo Step 4: Verifying task...
echo ======================================
schtasks /query /tn "EnactusPortalBackup" /fo LIST

echo.
echo ======================================
echo ✅ BACKUP SCHEDULER SETUP COMPLETE
echo ======================================
echo.
echo Next backup: This Sunday at 2:00 AM
echo Backup location: d:\E-Portal\enactus-portal\server\backups\
echo Log file: d:\E-Portal\enactus-portal\server\backup.log
echo.
echo To test the scheduled task:
echo schtasks /run /tn "EnactusPortalBackup"
echo.
echo To disable backups:
echo schtasks /delete /tn "EnactusPortalBackup" /f
echo.
echo Press any key to exit...
pause >nul
