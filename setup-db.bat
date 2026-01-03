@echo off
echo Creating PostgreSQL database for CaseWise Assess...

:: Create database
createdb -U postgres casewise_assess

:: Check if successful
if %errorlevel% equ 0 (
    echo Database 'casewise_assess' created successfully!
) else (
    echo Failed to create database. Make sure PostgreSQL is running and you have the correct permissions.
)

pause