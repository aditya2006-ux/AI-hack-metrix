@echo off
echo ========================================
echo PHARMA-AI GitHub Upload Script
echo ========================================
echo.

REM Configure Git
"C:\Program Files\Git\bin\git.exe" config --global user.name "aditya2006-ux"
"C:\Program Files\Git\bin\git.exe" config --global user.email "gdad3565@gmail.com"

REM Initialize repository if needed
if not exist .git (
    echo Initializing Git repository...
    "C:\Program Files\Git\bin\git.exe" init
)

REM Add all files
echo Adding files to Git...
"C:\Program Files\Git\bin\git.exe" add .

REM Commit
echo Committing changes...
"C:\Program Files\Git\bin\git.exe" commit -m "Initial commit: PHARMA-AI - AI-Driven Pharmaceutical Formulation Optimizer"

REM Instructions for GitHub
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Create a new repository on GitHub: https://github.com/new
echo 2. Name it: pharma-ai
echo 3. DO NOT initialize with README, .gitignore, or license
echo 4. Copy the repository URL (e.g., https://github.com/aditya2006-ux/pharma-ai.git)
echo 5. Run these commands:
echo.
echo    "C:\Program Files\Git\bin\git.exe" remote add origin YOUR_REPO_URL
echo    "C:\Program Files\Git\bin\git.exe" branch -M main
echo    "C:\Program Files\Git\bin\git.exe" push -u origin main
echo.
echo ========================================
pause
