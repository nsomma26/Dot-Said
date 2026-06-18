@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Sesto Senso

echo.
echo  === SESTO SENSO ===
echo.

REM --- Trova Python ---
set "PY="
where py >nul 2>&1
if %ERRORLEVEL% equ 0 set "PY=py -3"
if not defined PY (
    where python >nul 2>&1
    if %ERRORLEVEL% equ 0 set "PY=python"
)

if not defined PY (
    echo ERRORE: Python non trovato.
    echo Scarica da https://www.python.org/downloads/
    echo e spunta "Add Python to PATH" durante l'installazione.
    echo.
    pause
    exit /b 1
)

REM --- Libera porta 8765 se occupata da un server precedente ---
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr ":8765" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
)

REM --- Trova una porta libera ---
set PORT=8765
:findport
%PY% -c "import socket;s=socket.socket();s.bind(('127.0.0.1',%PORT%));s.close()" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    set /a PORT+=1
    if %PORT% LSS 8775 goto findport
    echo ERRORE: nessuna porta libera. Chiudi altre finestre del server.
    pause
    exit /b 1
)

echo Avvio server sulla porta %PORT%...
start "SestoSenso Server" /min cmd /c "cd /d "%~dp0" && %PY% -m http.server %PORT%"

echo Attendo avvio server...
ping 127.0.0.1 -n 4 >nul

set "URL=http://127.0.0.1:%PORT%/index.html"
echo Apertura browser: %URL%
start "" "%URL%"

echo.
echo  Server attivo su %URL%
echo  Se la pagina e' vuota, premi F5 nel browser.
echo  Per chiudere: chiudi la finestra "SestoSenso Server" nella barra applicazioni.
echo.
pause